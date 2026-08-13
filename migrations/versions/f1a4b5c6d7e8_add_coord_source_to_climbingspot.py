"""add coord_source to climbingspot

Revision ID: f1a4b5c6d7e8
Revises: e9c3d4f5a6b7
Create Date: 2026-08-13

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f1a4b5c6d7e8'
down_revision = 'e9c3d4f5a6b7'
branch_labels = None
depends_on = None


def upgrade():
    # Nullable with no server_default on purpose: existing rows stay NULL, which
    # means "provenance unknown" and is treated as approximate (like 'geocode').
    op.add_column('climbingspot', sa.Column('coord_source', sa.String(), nullable=True))


def downgrade():
    op.drop_column('climbingspot', 'coord_source')
