"""Add FCMToken model

Revision ID: 8684d2b39ede
Revises: c27f575876df
Create Date: 2025-06-05 23:16:22.382656

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8684d2b39ede'
down_revision = 'c27f575876df'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('fcmtoken',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.Column('token', sa.String(length=500), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('fcmtoken')
    # ### end Alembic commands ###
