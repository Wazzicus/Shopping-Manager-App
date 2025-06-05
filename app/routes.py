# routes.py
"""
routes.py

This module defines the main blueprint routes for the application, including
the homepage, dashboard, and AJAX-based list search functionality.

Routes:
- /: Home page
- /dashboard: Main user dashboard (requires login)
"""

import os
from flask import Blueprint, render_template, url_for, flash, redirect, send_from_directory
from flask_login import login_required, current_user
from app.models import Household as HouseholdModel, ShoppingList as ShoppingListModel, ActivityLog, ListItem as ListItemModel, FCMToken
from app.utils import format_action
from app.shopping_lists.forms import ShoppingListForm

main = Blueprint('main', __name__, template_folder="templates")

@main.route('/')
def index():
    """
    Public landing page.
    """
    return render_template('index.html')


@main.route('/dashboard')
@login_required
def dashboard():
    """
    Authenticated user's dashboard. Displays:
    - All shopping lists for the user's household
    - Recent household activity (latest 5 logs)
    - Household name and admin status
    - New shopping list form

    If the user doesn't belong to a household, they're redirected to household setup.
    """
    new_list_form = ShoppingListForm()
    household_id = current_user.household_id

    # Redirect if user is not in a household
    if not household_id:
        flash("You must join or create a household first.", "warning")
        return redirect(url_for('household_bp.setup'))

    household = HouseholdModel.query.get(household_id)

    # Redirect if household no longer exists
    if not household:
        flash("Household not found.", "danger")
        return redirect(url_for('main.dashboard'))

    is_admin = (current_user.id == household.admin_id)

    # Fetch all shopping lists for the household, newest first
    all_household_lists = ShoppingListModel.query.filter_by(
        household_id=household_id
    ).order_by(
        ShoppingListModel.created_at.desc()
    ).all()
    # shared_lists = ShoppingListModel.query.filter_by(
    #     household_id=household_id, is_shared=True
    # ).order_by(
    #     ShoppingListModel.created_at.desc()
    # ).all()
    # personal_lists = ShoppingListModel.query.filter_by(
    #     user_id=current_user.id,is_shared=False
    # ).order_by(
    #     ShoppingListModel.created_at.desc()
    # ).all()

    # Fetch 5 most recent activities
    recent_activity = ActivityLog.query.filter_by(
        household_id=household_id
    ).order_by(
        ActivityLog.timestamp.desc()
    ).limit(5).all()

    return render_template(
        'dashboard.html',
        title=f"Dashboard - {household.name}",
        household=household,
        lists=all_household_lists,
        is_admin=is_admin,
        recent_activity=recent_activity,
        format_action=format_action,
        new_list_form=new_list_form
    )

@main.route('/service-worker.js')
def serviceworker():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../'))
    return send_from_directory(root, 'service-worker/service-worker.js')

@main.route('/offline')
def offline():
    return render_template("offline.html")

@main.route('/store-token', methods=['POST'])
@login_required
def store_token():
    data = request.get_json()
    token = data.get("token")
    if not token:
        return jsonify({"error": "Missing token"}), 400

    existing = FCMToken.query.filter_by(user_id=current_user.id).first()
    if existing:
        existing.token = token
    else:
        new_token = FCMToken(user_id=current_user.id, token=token)
        db.session.add(new_token)
    db.session.commit()

    return jsonify({"success": True})