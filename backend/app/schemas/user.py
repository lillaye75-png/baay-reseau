from pydantic import BaseModel
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    phone: str
    password: str
    role: str = "owner"


class UserLogin(BaseModel):
    phone: str
    password: str


class UserRead(BaseModel):
    id: str
    tenant_id: str
    name: str
    phone: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
