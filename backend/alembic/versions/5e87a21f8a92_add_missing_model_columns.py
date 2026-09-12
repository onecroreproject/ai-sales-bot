"""add_missing_model_columns

Revision ID: 5e87a21f8a92
Revises: 2f98705afe1b
Create Date: 2026-09-11 11:57:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5e87a21f8a92'
down_revision: Union[str, Sequence[str], None] = '2f98705afe1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing columns to companies table
    op.add_column('companies', sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False))

    # Add missing columns to widget_configs table
    op.add_column('widget_configs', sa.Column('widget_icon', sa.String(length=50), server_default='Bot', nullable=False))
    op.add_column('widget_configs', sa.Column('custom_icon_url', sa.Text(), nullable=True))

    # Add missing columns to users table
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('users', sa.Column('verification_token', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_users_verification_token'), 'users', ['verification_token'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_verification_token'), table_name='users')
    op.drop_column('users', 'verification_token')
    op.drop_column('users', 'email_verified')
    op.drop_column('widget_configs', 'custom_icon_url')
    op.drop_column('widget_configs', 'widget_icon')
    op.drop_column('companies', 'is_verified')
