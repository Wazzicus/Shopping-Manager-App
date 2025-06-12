"""
models.py

This module defines all database models for the web app.

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
from sqlalchemy import CheckConstraint, Index
from sqlalchemy.orm import validates

tz = get_localzone()

def now_local():
    return datetime.now(tz)

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    name = db.Column(db.String(80), nullable=False)
    password = db.Column("password", db.String(128), nullable=False)
    role = db.Column(db.String(20), default='member', nullable=False)  # member or admin
    avatar_url = db.Column(db.String(256), nullable=True)

    household_id = db.Column(db.Integer, db.ForeignKey('households.id', ondelete='SET NULL'), nullable=True)

    household = db.relationship(
        'Household', 
        back_populates='members', 
        foreign_keys=[household_id] 
    )
    
    created_lists = db.relationship(
        'ShoppingList', 
        back_populates='creator', 
        lazy='select',
        cascade='all, delete-orphan'
    )
    
    added_items = db.relationship(
        'ListItem', 
        back_populates='added_by_user', 
        lazy='select'
    )
    
    activities = db.relationship(
        'ActivityLog', 
        back_populates='user', 
        lazy='select',
        cascade='all, delete-orphan'
    )
    
    push_tokens = db.relationship(
        'FCMToken', 
        back_populates='user', 
        lazy='select',
        cascade='all, delete-orphan'
    )

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
    join_code = db.Column(db.String(36), unique=True, nullable=False, 
                         default=lambda: secrets.token_hex(4).upper(), index=True)
    name = db.Column(db.String(100), nullable=False)

    admin_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)

    admin = db.relationship(
        'User', 
        foreign_keys=[admin_id],
        post_update = True
    )

    members = db.relationship(
        'User', 
        back_populates='household', 
        foreign_keys=[User.household_id]  
    )
    
    shopping_lists = db.relationship(
        'ShoppingList', 
        back_populates='household', 
        lazy='select', 
        cascade="all, delete-orphan"
    )
    
    activities = db.relationship(
        'ActivityLog', 
        back_populates='household', 
        lazy='select',
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f'<Household {self.name} ({self.join_code})>'


class ShoppingList(db.Model):
    __tablename__ = 'shopping_lists'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=now_local, nullable=False)

    items_count = db.Column(db.Integer, default=0, nullable=False)
    purchased_items_count = db.Column(db.Integer, default=0, nullable=False)

    household_id = db.Column(db.Integer, db.ForeignKey('households.id', ondelete='CASCADE'), nullable=False)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)

    household = db.relationship(
        'Household', 
        back_populates='shopping_lists', 
        lazy='select'
    )
    
    creator = db.relationship(
        'User', 
        back_populates='created_lists', 
        lazy='select'
    )

    items = db.relationship(
        'ListItem', 
        back_populates='shopping_list', 
        lazy='select', 
        cascade="all, delete-orphan",
        order_by='ListItem.added_at.desc()'
    )

    def __repr__(self):
        return f'<ShoppingList {self.name}>'


class ListItem(db.Model):
    __tablename__ = 'list_items'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    measure = db.Column(db.String(10), nullable=False, default='')
    purchased = db.Column(db.Boolean, default=False, nullable=False)
    note = db.Column(db.String(100, nullable=True))
    added_at = db.Column(db.DateTime(timezone=True), default=now_local, nullable=False)


    shoppinglist_id = db.Column(db.Integer, db.ForeignKey('shopping_lists.id', ondelete='CASCADE'), nullable=False)
    added_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)

    shopping_list = db.relationship(
        'ShoppingList', 
        back_populates='items', 
        lazy='select'
    )
    
    added_by_user = db.relationship(
        'User', 
        back_populates='added_items', 
        lazy='select'
    )


    def __repr__(self):
        return f'<ListItem {self.name} (qty: {self.quantity})>'


class ActivityLog(db.Model):
    __tablename__ = 'activity_log'

    id = db.Column(db.Integer, primary_key=True)
    action_type = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime(timezone=True), default=now_local, nullable=False)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    household_id = db.Column(db.Integer, db.ForeignKey('households.id', ondelete='CASCADE'), nullable=False)

    user = db.relationship(
        'User', 
        back_populates='activities', 
        lazy='select'
    )
    
    household = db.relationship(
        'Household', 
        back_populates='activities', 
        lazy='select'
    )

    def __repr__(self):
        return f'<ActivityLog user={self.user_id} action={self.action_type}>'


class FCMToken(db.Model):
    __tablename__ = 'fcm_tokens'

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(500), nullable=False, unique=True)
    created_at = db.Column(db.DateTime(timezone=True), default=now_local, nullable=False)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    user = db.relationship(
        'User', 
        back_populates='push_tokens', 
        lazy='select'
    )

    def __repr__(self):
        return f"<FCMToken user_id={self.user_id}>"