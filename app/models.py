"""
models.py

This module defines all database models for the Shopping Manager web app.

Models:
- User: Registered user with roles and avatar support
- Household: A shared group with members and shopping lists
- ShoppingList: A list of items belonging to a household
- ListItem: An individual item in a shopping list
- ActivityLog: Tracks user actions within a household
- FCMToken: Firebase Cloud Messaging token store for push notifications
"""

from flask import url_for
from app.extensions import db
from flask_login import UserMixin
from datetime import datetime
from tzlocal import get_localzone
import secrets

tz = get_localzone()

def now_local():
    return datetime.now(tz)

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(80), nullable=False)
    password = db.Column("password", db.String(128), nullable=False)
    role = db.Column(db.String(20), default='member')  # member or admin
    avatar_url = db.Column(db.String(256), nullable=True)

    # Relationships
    household_id = db.Column(db.Integer, db.ForeignKey('households.id'))
    household = db.relationship('Household', back_populates='members', foreign_keys=[household_id], lazy='select')
    administered_household = db.relationship('Household', back_populates='admin',
                                             foreign_keys='Household.admin_id', uselist=False, lazy='select')
    created_lists = db.relationship('ShoppingList', backref='creator', lazy='select')
    added_items = db.relationship('ListItem', backref='added_by', lazy='select')
    activities = db.relationship('ActivityLog', backref='user', lazy='select')
    push_tokens = db.relationship('FCMToken', backref='user', lazy='select')

    def get_avatar_url(self):
        if not self.avatar_url:
            return f"https://api.dicebear.com/7.x/initials/svg?seed={self.username}"
        if self.avatar_url.startswith(('http://', 'https://')):
            return self.avatar_url
        return url_for('files_bp.uploaded_file', filename=self.avatar_url)

    def __repr__(self):
        return f'<User {self.username}>'


class Household(db.Model):
    __tablename__ = 'households'

    id = db.Column(db.Integer, primary_key=True)
    join_code = db.Column(db.String(36), unique=True, nullable=False, default=lambda: secrets.token_hex(4).upper())
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=now_local)

    admin_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    admin = db.relationship('User', back_populates='administered_household', foreign_keys=[admin_id], lazy='select')

    members = db.relationship('User', back_populates='household', lazy='select', foreign_keys='User.household_id')
    shopping_lists = db.relationship('ShoppingList', backref='household', lazy='select', cascade="all, delete-orphan")
    activities = db.relationship('ActivityLog', backref='household', lazy='select')

    def __repr__(self):
        return f'<Household {self.name} ({self.join_code})>'


class ShoppingList(db.Model):
    __tablename__ = 'shopping_lists'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    household_id = db.Column(db.Integer, db.ForeignKey('households.id'), nullable=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=now_local)

    items_count = db.Column(db.Integer, default=0)
    purchased_items_count = db.Column(db.Integer, default=0)

    items = db.relationship('ListItem', backref='shopping_list', lazy='select', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<ShoppingList {self.name}>'


class ListItem(db.Model):
    __tablename__ = 'list_items'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    measure = db.Column(db.String(10), nullable=False, default='')

    shoppinglist_id = db.Column(db.Integer, db.ForeignKey('shopping_lists.id'), nullable=False)
    added_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    added_at = db.Column(db.DateTime(timezone=True), default=now_local)
    purchased = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<ListItem {self.name}>'


class ActivityLog(db.Model):
    __tablename__ = 'activity_log'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    household_id = db.Column(db.Integer, db.ForeignKey('households.id'), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime(timezone=True), default=now_local)

    def __repr__(self):
        return f'<ActivityLog user={self.user_id} action={self.action_type}>'


class FCMToken(db.Model):
    __tablename__ = 'fcm_tokens'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(500), nullable=False)

    def __repr__(self):
        return f"<FCMToken user_id={self.user_id}>"
