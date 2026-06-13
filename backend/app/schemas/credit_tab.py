from pydantic import BaseModel
from datetime import datetime


class CreditTabEntryCreate(BaseModel):
    customer_id: str
    amount_cfa: int
    description: str | None = None
    sale_id: str | None = None


class CreditTabEntryRead(BaseModel):
    id: str
    amount_cfa: int
    description: str | None
    sale_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CreditTabRead(BaseModel):
    id: str
    customer_id: str
    balance_cfa: int
    is_active: bool
    created_at: datetime
    entries: list[CreditTabEntryRead]

    model_config = {"from_attributes": True}
