"""Initial schema — all tables

Revision ID: 001_initial
Revises:
Create Date: 2026-06-13
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("subscription_plan", sa.String(50), server_default="free"),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("tenant_id", sa.String(36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), server_default="owner"),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "product_categories",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("tenant_id", sa.String(36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("name_wo", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "products",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("tenant_id", sa.String(36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("category_id", sa.String(36), sa.ForeignKey("product_categories.id"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("sku", sa.String(100), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("price_cfa", sa.Integer, nullable=False),
        sa.Column("cost_price_cfa", sa.Integer, server_default="0"),
        sa.Column("stock_quantity", sa.Integer, server_default="0"),
        sa.Column("low_stock_threshold", sa.Integer, server_default="5"),
        sa.Column("unit", sa.String(20), server_default="piece"),
        sa.Column("barcode", sa.String(100), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("is_online", sa.Boolean, server_default=sa.text("1")),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "product_images",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("product_id", sa.String(36), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("alt_text", sa.String(255), nullable=True),
        sa.Column("sort_order", sa.Integer, server_default="0"),
        sa.Column("is_primary", sa.Boolean, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "customers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("tenant_id", sa.String(36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("whatsapp_number", sa.String(50), nullable=True),
        sa.Column("nickname", sa.String(255), nullable=True),
        sa.Column("total_credit_cfa", sa.Integer, server_default="0"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "sales",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("tenant_id", sa.String(36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("customer_id", sa.String(36), sa.ForeignKey("customers.id"), nullable=True),
        sa.Column("total_cfa", sa.Integer, nullable=False),
        sa.Column("payment_method", sa.String(50), nullable=False),
        sa.Column("payment_reference", sa.String(255), nullable=True),
        sa.Column("is_credit", sa.Boolean, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "sale_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("sale_id", sa.String(36), sa.ForeignKey("sales.id"), nullable=False),
        sa.Column("product_id", sa.String(36), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("unit_price_cfa", sa.Integer, nullable=False),
        sa.Column("total_cfa", sa.Integer, nullable=False),
    )

    op.create_table(
        "credit_tabs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("customer_id", sa.String(36), sa.ForeignKey("customers.id"), nullable=False),
        sa.Column("balance_cfa", sa.Integer, server_default="0"),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "credit_tab_entries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("tab_id", sa.String(36), sa.ForeignKey("credit_tabs.id"), nullable=False),
        sa.Column("amount_cfa", sa.Integer, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("sale_id", sa.String(36), sa.ForeignKey("sales.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("tenant_id", sa.String(36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("customer_name", sa.String(255), nullable=False),
        sa.Column("customer_phone", sa.String(50), nullable=False),
        sa.Column("customer_email", sa.String(255), nullable=True),
        sa.Column("customer_address", sa.Text, nullable=False),
        sa.Column("customer_notes", sa.Text, nullable=True),
        sa.Column("total_cfa", sa.Integer, nullable=False),
        sa.Column("payment_method", sa.String(50), server_default="wave"),
        sa.Column("payment_reference", sa.String(255), nullable=True),
        sa.Column("status", sa.String(30), server_default="pending"),
        sa.Column("delivery_method", sa.String(50), server_default="delivery"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "order_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("product_id", sa.String(36), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("product_name", sa.String(255), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("unit_price_cfa", sa.Integer, nullable=False),
        sa.Column("total_cfa", sa.Integer, nullable=False),
    )

    op.create_table(
        "storefront_settings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("tenant_id", sa.String(36), sa.ForeignKey("tenants.id"), unique=True, nullable=False),
        sa.Column("is_enabled", sa.Boolean, server_default=sa.text("0")),
        sa.Column("store_name", sa.String(255), nullable=True),
        sa.Column("store_description", sa.Text, nullable=True),
        sa.Column("banner_url", sa.String(500), nullable=True),
        sa.Column("theme_color", sa.String(20), server_default="#ea580c"),
        sa.Column("currency", sa.String(10), server_default="CFA"),
        sa.Column("min_order_cfa", sa.Integer, server_default="0"),
        sa.Column("delivery_fee_cfa", sa.Integer, server_default="0"),
        sa.Column("accepts_wave", sa.Boolean, server_default=sa.text("1")),
        sa.Column("accepts_orange_money", sa.Boolean, server_default=sa.text("1")),
        sa.Column("accepts_cash_on_delivery", sa.Boolean, server_default=sa.text("1")),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("whatsapp", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "product_reviews",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("product_id", sa.String(36), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("tenant_id", sa.String(36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("customer_name", sa.String(255), nullable=False),
        sa.Column("rating", sa.Integer, nullable=False),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("is_approved", sa.Boolean, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "suppliers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("tenant_id", sa.String(36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "purchase_orders",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("tenant_id", sa.String(36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("supplier_id", sa.String(36), sa.ForeignKey("suppliers.id"), nullable=True),
        sa.Column("total_cfa", sa.Integer, server_default="0"),
        sa.Column("status", sa.String(30), server_default="pending"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "purchase_order_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("purchase_order_id", sa.String(36), sa.ForeignKey("purchase_orders.id"), nullable=False),
        sa.Column("product_id", sa.String(36), sa.ForeignKey("products.id"), nullable=True),
        sa.Column("product_name", sa.String(255), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("unit_cost_cfa", sa.Integer, nullable=False),
        sa.Column("total_cfa", sa.Integer, nullable=False),
    )

    op.create_table(
        "expenses",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("tenant_id", sa.String(36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("amount_cfa", sa.Integer, nullable=False),
        sa.Column("expense_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("expenses")
    op.drop_table("purchase_order_items")
    op.drop_table("purchase_orders")
    op.drop_table("suppliers")
    op.drop_table("product_reviews")
    op.drop_table("storefront_settings")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("credit_tab_entries")
    op.drop_table("credit_tabs")
    op.drop_table("sale_items")
    op.drop_table("sales")
    op.drop_table("customers")
    op.drop_table("product_images")
    op.drop_table("products")
    op.drop_table("product_categories")
    op.drop_table("users")
    op.drop_table("tenants")
