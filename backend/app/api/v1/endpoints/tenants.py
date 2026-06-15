from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user, require_owner
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.tenant import TenantRead, TenantUpdate

router = APIRouter()


@router.get("/me", response_model=TenantRead)
async def get_my_tenant(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.put("/{tenant_id}", response_model=TenantRead)
async def update_tenant(tenant_id: str, data: TenantUpdate, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    if user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)
    await db.flush()
    return tenant
