import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Integer, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"))
    customer_name: Mapped[str] = mapped_column(String(255))
    customer_phone: Mapped[str] = mapped_column(String(50))
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_address: Mapped[str] = mapped_column(Text)
    customer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_cfa: Mapped[int] = mapped_column(Integer)
    payment_method: Mapped[str] = mapped_column(String(50), default="wave")
    payment_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="pending")
    delivery_method: Mapped[str] = mapped_column(String(50), default="delivery")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id"))
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"))
    product_name: Mapped[str] = mapped_column(String(255))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price_cfa: Mapped[int] = mapped_column(Integer)
    total_cfa: Mapped[int] = mapped_column(Integer)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class StorefrontSettings(Base):
    __tablename__ = "storefront_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), unique=True)
    is_enabled: Mapped[bool] = mapped_column(default=False)
    store_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    store_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    theme_color: Mapped[str] = mapped_column(String(20), default="#ea580c")
    currency: Mapped[str] = mapped_column(String(10), default="CFA")
    min_order_cfa: Mapped[int] = mapped_column(Integer, default=0)
    delivery_fee_cfa: Mapped[int] = mapped_column(Integer, default=0)
    accepts_wave: Mapped[bool] = mapped_column(default=True)
    accepts_orange_money: Mapped[bool] = mapped_column(default=True)
    accepts_cash_on_delivery: Mapped[bool] = mapped_column(default=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant")
