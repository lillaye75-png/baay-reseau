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
    wizard_completed: bool | None = None


class TenantIntegrations(BaseModel):
    whatsapp_api_token: str | None = None
    whatsapp_phone_number_id: str | None = None
    wave_api_key: str | None = None
    orange_money_api_key: str | None = None


class TenantRead(BaseModel):
    id: str
    name: str
    slug: str
    phone: str
    email: str | None
    subscription_plan: str
    wizard_completed: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
