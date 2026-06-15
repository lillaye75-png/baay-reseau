import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Integer, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Licence(Base):
    __tablename__ = "licences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    licence_key: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    tier: Mapped[str] = mapped_column(String(20), default="free")
    features: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(String(36), ForeignKey("tenants.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    duration_days: Mapped[int] = mapped_column(Integer, default=30)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(String(36), default="system")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    tenant = relationship("Tenant")


TIER_FEATURES = {
    "free": {
        "max_products": 50,
        "max_customers": 100,
        "max_employees": 1,
        "online_store": False,
        "whatsapp_bot": False,
        "reports": True,
        "api_access": False,
        "priority_support": False,
        "multi_store": False,
    },
    "pro": {
        "max_products": 500,
        "max_customers": 1000,
        "max_employees": 5,
        "online_store": True,
        "whatsapp_bot": True,
        "reports": True,
        "api_access": True,
        "priority_support": True,
        "multi_store": False,
    },
    "enterprise": {
        "max_products": -1,
        "max_customers": -1,
        "max_employees": -1,
        "online_store": True,
        "whatsapp_bot": True,
        "reports": True,
        "api_access": True,
        "priority_support": True,
        "multi_store": True,
    },
}

SUPER_ADMIN_PHONES = ["776621410", "708372127"]
