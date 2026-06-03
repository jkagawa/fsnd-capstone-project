"""add date_added to climbingspot

Revision ID: e9c3d4f5a6b7
Revises: d8b2c3e4f5a6
Create Date: 2026-06-03

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e9c3d4f5a6b7'
down_revision = 'd8b2c3e4f5a6'
branch_labels = None
depends_on = None


def upgrade():
    # server_default backfills existing rows with the migration timestamp.
    op.add_column('climbingspot',
        sa.Column('date_added', sa.DateTime(), server_default=sa.func.now(), nullable=True))


def downgrade():
    op.drop_column('climbingspot', 'date_added')
