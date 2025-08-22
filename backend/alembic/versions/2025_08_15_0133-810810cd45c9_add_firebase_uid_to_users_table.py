"""add firebase_uid to users table

Revision ID: 810810cd45c9
Revises: a03b0fa7e93b
Create Date: 2025-08-15 01:33:57.381586

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "810810cd45c9"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: add firebase_uid column to users table"""
    op.add_column("users", sa.Column("firebase_uid", sa.String(), unique=True, nullable=True))


def downgrade() -> None:
    """Downgrade schema: remove firebase_uid column from users table"""
    op.drop_column("users", "firebase_uid")
