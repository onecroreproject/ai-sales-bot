"""add_reset_password_token_to_users

Revision ID: 7b92f4e90c2a
Revises: 6a81e3f89d1b
Create Date: 2026-10-12 14:28:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b92f4e90c2a'
down_revision: Union[str, Sequence[str], None] = '6a81e3f89d1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('reset_password_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('reset_password_token_expires_at', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_users_reset_password_token'), 'users', ['reset_password_token'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_reset_password_token'), table_name='users')
    op.drop_column('users', 'reset_password_token_expires_at')
    op.drop_column('users', 'reset_password_token')
