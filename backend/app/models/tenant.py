import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Boolean, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    phone: Mapped[str] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    subscription_plan: Mapped[str] = mapped_column(String(50), default="free")
    stripe_customer_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    subscription_status: Mapped[str] = mapped_column(String(30), default="active")
    subscription_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    referral_code: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    referred_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    referral_credits: Mapped[int] = mapped_column(Integer, default=0)
    loyalty_points: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    license_days: Mapped[int] = mapped_column(Integer, default=30)
    license_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    wizard_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    whatsapp_api_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    whatsapp_phone_number_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    wave_api_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    orange_money_api_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    print_logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    print_header_text: Mapped[str | None] = mapped_column(String(500), nullable=True)
    print_footer_text: Mapped[str | None] = mapped_column(String(500), nullable=True)
    print_show_barcode: Mapped[bool] = mapped_column(Boolean, default=True)
    print_show_qr: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="tenant")
    products = relationship("Product", back_populates="tenant")
    customers = relationship("Customer", back_populates="tenant")
    sales = relationship("Sale", back_populates="tenant", foreign_keys="[Sale.tenant_id]")
    orders = relationship("Order", back_populates="tenant")
