"""rename name to nickname in children

Revision ID: 01ed087c01ed
Revises: 2fd1c1547f2c
Create Date: 2025-08-21 01:36:14.225693

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "01ed087c01ed"
down_revision: Union[str, Sequence[str], None] = "2fd1c1547f2c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: rename column name -> nickname in children"""
    op.alter_column("children", "name", new_column_name="nickname")


def downgrade() -> None:
    """Downgrade schema: revert nickname -> name in children"""
    op.alter_column("children", "nickname", new_column_name="name")
