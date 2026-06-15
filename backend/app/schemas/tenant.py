from pydantic import BaseModel
from datetime import datetime


class TenantCreate(BaseModel):
    name: str
    slug: str
    phone: str
    email: str | None = None


class TenantUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    phone: str | None = None
    email: str | None = None


class TenantRead(BaseModel):
    id: str
    name: str
    slug: str
    phone: str
    email: str | None
    subscription_plan: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
