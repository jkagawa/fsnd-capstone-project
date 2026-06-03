"""add username to climber

Revision ID: d8b2c3e4f5a6
Revises: c7a1b2d3e4f5
Create Date: 2026-06-03

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd8b2c3e4f5a6'
down_revision = 'c7a1b2d3e4f5'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('climber', sa.Column('username', sa.String(), nullable=True))
    # Case-insensitive uniqueness; lower(NULL) is NULL so existing rows without a
    # username are unaffected (multiple NULLs are allowed).
    op.create_index('uq_climber_username_lower', 'climber',
                    [sa.text('lower(username)')], unique=True)


def downgrade():
    op.drop_index('uq_climber_username_lower', table_name='climber')
    op.drop_column('climber', 'username')
