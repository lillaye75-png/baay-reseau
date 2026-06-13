from pydantic import BaseModel
from datetime import datetime


class CustomerCreate(BaseModel):
    name: str
    phone: str | None = None
    whatsapp_number: str | None = None
    nickname: str | None = None
    notes: str | None = None


class CustomerRead(BaseModel):
    id: str
    tenant_id: str
    name: str
    phone: str | None
    whatsapp_number: str | None
    nickname: str | None
    total_credit_cfa: int
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
