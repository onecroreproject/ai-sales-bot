"""add_byok_columns_to_companies

Revision ID: 6a81e3f89d1b
Revises: 5e87a21f8a92
Create Date: 2026-10-12 13:56:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6a81e3f89d1b'
down_revision: Union[str, Sequence[str], None] = '5e87a21f8a92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add BYOK fields to companies table
    op.add_column('companies', sa.Column('llm_provider', sa.String(length=50), server_default='openai', nullable=False))
    op.add_column('companies', sa.Column('llm_model', sa.String(length=100), server_default='gpt-4o-mini', nullable=False))
    op.add_column('companies', sa.Column('llm_api_key', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('companies', 'llm_api_key')
    op.drop_column('companies', 'llm_model')
    op.drop_column('companies', 'llm_provider')
