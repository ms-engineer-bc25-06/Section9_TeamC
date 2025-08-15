"""add firebase_uid to users table

Revision ID: 810810cd45c9
Revises: a03b0fa7e93b
Create Date: 2025-08-15 01:33:57.381586

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '810810cd45c9'
down_revision: Union[str, Sequence[str], None] = 'a03b0fa7e93b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # firebase_uid column already exists from manual SQL
    # This is a no-op migration for team sync
    pass


def downgrade() -> None:
    """Downgrade schema."""
    # This migration doesn't change anything
    pass
