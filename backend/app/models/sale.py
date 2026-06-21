import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"))
    store_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("tenants.id"), nullable=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    customer_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("customers.id"), nullable=True)
    total_cfa: Mapped[int] = mapped_column(Integer)
    payment_method: Mapped[str] = mapped_column(String(50))
    payment_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_credit: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="sales", foreign_keys=[tenant_id])
    store = relationship("Tenant", foreign_keys=[store_id])
    user = relationship("User", foreign_keys=[user_id])
    customer = relationship("Customer")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sale_id: Mapped[str] = mapped_column(String(36), ForeignKey("sales.id"))
    product_id: Mapped[str] = mapped_column(String(36), nullable=True)
    product_name: Mapped[str] = mapped_column(String(255), default="")
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price_cfa: Mapped[int] = mapped_column(Integer)
    total_cfa: Mapped[int] = mapped_column(Integer)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", foreign_keys=[product_id], primaryjoin="SaleItem.product_id == Product.id", viewonly=True, post_update=True)
