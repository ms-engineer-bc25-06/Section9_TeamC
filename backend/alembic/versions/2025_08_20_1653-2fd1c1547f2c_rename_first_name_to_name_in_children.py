"""rename first_name to name in children

Revision ID: 2fd1c1547f2c
Revises: 810810cd45c9
Create Date: 2025-08-20 16:53:26.857616
"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2fd1c1547f2c"
down_revision: Union[str, Sequence[str], None] = "810810cd45c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: rename nickname -> name in children table"""
    op.alter_column("children", "nickname", new_column_name="name")


def downgrade() -> None:
    """Downgrade schema: rename name -> nickname in children table"""
    op.alter_column("children", "name", new_column_name="nickname")
