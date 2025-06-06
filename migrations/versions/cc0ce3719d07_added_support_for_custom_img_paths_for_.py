"""Added support for custom img paths for users

Revision ID: cc0ce3719d07
Revises: 535f53e22245
Create Date: 2025-05-14 18:29:06.757480

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cc0ce3719d07'
down_revision = '535f53e22245'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('avatar_path', sa.String(length=256), nullable=True))
        batch_op.drop_column('avatar_filename')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('avatar_filename', sa.VARCHAR(length=128), nullable=True))
        batch_op.drop_column('avatar_path')

    # ### end Alembic commands ###
