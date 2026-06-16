from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, timedelta
import secrets
import string

from app.core.database import get_db
from app.api.deps import get_current_user, require_owner
from app.models.user import User
from app.models.tenant import Tenant
from app.models.licence import Licence, TIER_FEATURES, SUPER_ADMIN_PHONES

router = APIRouter()


def is_super_admin(user: User) -> bool:
    return user.phone in SUPER_ADMIN_PHONES


def generate_licence_key(tier: str) -> str:
    prefix_map = {"free": "BAY-F", "pro": "BAY-P", "enterprise": "BAY-E"}
    prefix = prefix_map.get(tier, "BAY-X")
    chars = string.ascii_uppercase + string.digits
    segment = "".join(secrets.choice(chars) for _ in range(4))
    return f"{prefix}-{segment}-{''.join(secrets.choice(chars) for _ in range(4))}-{''.join(secrets.choice(chars) for _ in range(4))}"


@router.get("/my")
async def get_my_licence(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Licence).where(Licence.assigned_to == user.tenant_id, Licence.is_active == True)
        .order_by(Licence.created_at.desc()).limit(1)
    )
    licence = result.scalar_one_or_none()

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tenant_result.scalar_one_or_none()

    if licence and licence.expires_at:
        exp = licence.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            return {"licence": None, "expired": True, "expires_at": licence.expires_at.isoformat(), "tier": licence.tier}

    features = TIER_FEATURES.get(licence.tier if licence else "free", TIER_FEATURES["free"])

    return {
        "licence": {
            "id": licence.id if licence else None,
            "key": licence.licence_key if licence else None,
            "tier": licence.tier if licence else "free",
            "features": features,
            "expires_at": licence.expires_at.isoformat() if licence and licence.expires_at else None,
            "activated_at": licence.activated_at.isoformat() if licence and licence.activated_at else None,
        } if licence else None,
        "expired": False,
        "trial": not bool(licence) and tenant and not tenant.license_expires_at,
    }


@router.post("/activate")
async def activate_licence(data: dict, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    key = data.get("key", "").strip().upper()
    if not key:
        raise HTTPException(status_code=400, detail="Clé de licence requise")

    result = await db.execute(select(Licence).where(Licence.licence_key == key))
    licence = result.scalar_one_or_none()
    if not licence:
        raise HTTPException(status_code=404, detail="Licence introuvable")

    if not licence.is_active:
        raise HTTPException(status_code=400, detail="Cette licence a été désactivée")

    if licence.assigned_to and licence.assigned_to != user.tenant_id:
        raise HTTPException(status_code=403, detail="Cette licence est assignée à un autre compte")

    now = datetime.now(timezone.utc)
    licence.assigned_to = user.tenant_id
    licence.activated_at = now
    licence.expires_at = now + timedelta(days=licence.duration_days)
    licence.is_active = True

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if tenant:
        tenant.subscription_plan = licence.tier
        tenant.license_expires_at = licence.expires_at
        tenant.is_active = True

    await db.flush()
    return {"status": "activated", "tier": licence.tier, "expires_at": licence.expires_at.isoformat()}


@router.get("/all")
async def list_all_licences(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(select(Licence).order_by(Licence.created_at.desc()))
    licences = result.scalars().all()
    return [{
        "id": l.id,
        "licence_key": l.licence_key,
        "tier": l.tier,
        "is_active": l.is_active,
        "assigned_to": l.assigned_to,
        "duration_days": l.duration_days,
        "expires_at": l.expires_at.isoformat() if l.expires_at else None,
        "activated_at": l.activated_at.isoformat() if l.activated_at else None,
        "created_at": l.created_at.isoformat(),
    } for l in licences]


@router.post("/generate")
async def generate_licence(data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    tier = data.get("tier", "free")
    duration_days = data.get("duration_days", 30)

    key = generate_licence_key(tier)
    licence = Licence(
        licence_key=key,
        tier=tier,
        duration_days=duration_days,
        created_by=user.id,
    )
    db.add(licence)
    await db.flush()
    return {"id": licence.id, "key": licence.licence_key, "tier": tier, "duration_days": duration_days}


@router.put("/{licence_id}/toggle")
async def toggle_licence(licence_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(select(Licence).where(Licence.id == licence_id))
    licence = result.scalar_one_or_none()
    if not licence:
        raise HTTPException(status_code=404, detail="Licence introuvable")

    licence.is_active = not licence.is_active

    now = datetime.now(timezone.utc)

    if licence.assigned_to:
        tenant_result = await db.execute(select(Tenant).where(Tenant.id == licence.assigned_to))
        tenant = tenant_result.scalar_one_or_none()
        if tenant:
            if licence.is_active:
                tenant.is_active = True
                tenant.license_expires_at = now + timedelta(days=licence.duration_days)
            else:
                tenant.is_active = False
                tenant.license_expires_at = now - timedelta(seconds=10)

    await db.flush()
    return {"is_active": licence.is_active}


@router.delete("/{licence_id}")
async def delete_licence(licence_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(select(Licence).where(Licence.id == licence_id))
    licence = result.scalar_one_or_none()
    if not licence:
        raise HTTPException(status_code=404, detail="Licence introuvable")

    if licence.assigned_to:
        tenant_result = await db.execute(select(Tenant).where(Tenant.id == licence.assigned_to))
        tenant = tenant_result.scalar_one_or_none()
        if tenant:
            tenant.license_expires_at = datetime.now(timezone.utc) - timedelta(seconds=10)
            tenant.is_active = False
            tenant.subscription_plan = "free"

    await db.delete(licence)
    await db.flush()
    return {"status": "deleted"}


@router.put("/{licence_id}/assign")
async def assign_licence(licence_id: str, data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Super admin uniquement")

    result = await db.execute(select(Licence).where(Licence.id == licence_id))
    licence = result.scalar_one_or_none()
    if not licence:
        raise HTTPException(status_code=404, detail="Licence introuvable")

    tenant_id = data.get("tenant_id")
    licence.assigned_to = tenant_id if tenant_id else None
    await db.flush()
    return {"assigned_to": licence.assigned_to}
