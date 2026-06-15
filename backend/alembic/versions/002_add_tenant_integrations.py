"""add tenant integrations and alter columns

Revision ID: 002
Revises: 001_initial
Create Date: 2026-06-15
"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tenants', sa.Column('whatsapp_api_token', sa.String(500), nullable=True))
    op.add_column('tenants', sa.Column('whatsapp_phone_number_id', sa.String(100), nullable=True))
    op.add_column('tenants', sa.Column('wave_api_key', sa.String(500), nullable=True))
    op.add_column('tenants', sa.Column('orange_money_api_key', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('tenants', 'orange_money_api_key')
    op.drop_column('tenants', 'wave_api_key')
    op.drop_column('tenants', 'whatsapp_phone_number_id')
    op.drop_column('tenants', 'whatsapp_api_token')
