"""add ai_feedback to challenges

Revision ID: add_ai_feedback
Revises: 01ed087c01ed
Create Date: 2025-09-01 21:30:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "add_ai_feedback"
down_revision = "01ed087c01ed"
branch_labels = None
depends_on = None


def upgrade():
    # Add ai_feedback column if it doesn't exist
    op.execute("""
        ALTER TABLE challenges
        ADD COLUMN IF NOT EXISTS ai_feedback TEXT
    """)


def downgrade():
    # Remove ai_feedback column
    op.drop_column("challenges", "ai_feedback")
