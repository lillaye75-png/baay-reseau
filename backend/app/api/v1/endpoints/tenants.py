from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.tenant import TenantRead

router = APIRouter()


@router.get("/me", response_model=TenantRead)
async def get_my_tenant(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.put("/{tenant_id}", response_model=TenantRead)
async def update_tenant(tenant_id: str, data: TenantRead, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        if field not in ("id", "subscription_plan", "is_active", "created_at"):
            setattr(tenant, field, value)
    await db.flush()
    return tenant
