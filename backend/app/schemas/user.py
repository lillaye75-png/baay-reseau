from pydantic import BaseModel, field_validator
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    phone: str
    password: str
    role: str = "owner"

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Le mot de passe doit contenir au moins 6 caractères")
        return v


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


class EmployeeUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    role: str | None = None
    is_active: bool | None = None


class Token(BaseModel):
    access_token: str
    refresh_token: str = ""
    token_type: str = "bearer"
    user: UserRead
