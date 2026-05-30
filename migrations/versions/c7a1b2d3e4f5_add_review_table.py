"""add review table

Revision ID: c7a1b2d3e4f5
Revises: 5a9ba9e00a1b
Create Date: 2026-05-29

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c7a1b2d3e4f5'
down_revision = '5a9ba9e00a1b'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'review',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('climbing_spot_id', sa.Integer(), nullable=False),
        sa.Column('added_by', sa.String(), nullable=False),
        sa.Column('author_name', sa.String(), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('body', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['climbing_spot_id'], ['climbingspot.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('review')
