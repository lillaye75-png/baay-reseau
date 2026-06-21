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
        "max_stores": 1,
        "max_sales_per_day": 50,
        "online_store": False,
        "whatsapp_bot": False,
        "reports": True,
        "reports_by_store": False,
        "api_access": False,
        "priority_support": False,
        "multi_store": False,
        "csv_import_export": False,
        "offline_sync": False,
        "stock_predictions": False,
        "print_settings": False,
        "delivery_tracking": False,
        "description": "7 jours d'essai — idéal pour démarrer",
    },
    "starter": {
        "max_products": 200,
        "max_customers": 500,
        "max_employees": 3,
        "max_stores": 2,
        "max_sales_per_day": 200,
        "online_store": True,
        "whatsapp_bot": False,
        "reports": True,
        "reports_by_store": True,
        "api_access": False,
        "priority_support": False,
        "multi_store": True,
        "csv_import_export": True,
        "offline_sync": True,
        "stock_predictions": False,
        "print_settings": True,
        "delivery_tracking": False,
        "description": "Pour les boutiques qui décollent — 200 produits, 2 boutiques",
    },
    "pro": {
        "max_products": 500,
        "max_customers": 1000,
        "max_employees": 5,
        "max_stores": 5,
        "max_sales_per_day": 500,
        "online_store": True,
        "whatsapp_bot": True,
        "reports": True,
        "reports_by_store": True,
        "api_access": True,
        "priority_support": True,
        "multi_store": True,
        "csv_import_export": True,
        "offline_sync": True,
        "stock_predictions": True,
        "print_settings": True,
        "delivery_tracking": True,
        "description": "Pour les boutiques en croissance — 500 produits, 5 boutiques, WhatsApp Bot",
    },
    "enterprise": {
        "max_products": -1,
        "max_customers": -1,
        "max_employees": -1,
        "max_stores": -1,
        "max_sales_per_day": -1,
        "online_store": True,
        "whatsapp_bot": True,
        "reports": True,
        "reports_by_store": True,
        "api_access": True,
        "priority_support": True,
        "multi_store": True,
        "csv_import_export": True,
        "offline_sync": True,
        "stock_predictions": True,
        "print_settings": True,
        "delivery_tracking": True,
        "description": "Tout illimité — support prioritaire dédié",
    },
}

SUPER_ADMIN_PHONES = ["776621410", "708372127"]
