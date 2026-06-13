import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CreditTab(Base):
    __tablename__ = "credit_tabs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey("customers.id"))
    balance_cfa: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    customer = relationship("Customer", back_populates="credit_tabs")
    entries = relationship("CreditTabEntry", back_populates="tab", cascade="all, delete-orphan")


class CreditTabEntry(Base):
    __tablename__ = "credit_tab_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tab_id: Mapped[str] = mapped_column(String(36), ForeignKey("credit_tabs.id"))
    amount_cfa: Mapped[int] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sale_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("sales.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    tab = relationship("CreditTab", back_populates="entries")
    sale = relationship("Sale")
