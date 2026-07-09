from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.core.security import decode_access_token
from app.core.database import async_session
from app.models.user import User

security = HTTPBearer()

SUPER_ADMIN_PHONES = ["776621410", "708372127"]


def get_user_tier_features(user: User) -> dict:
    from app.models.licence import TIER_FEATURES
    tier = "free"
    if user.tenant and user.tenant.subscription_plan and user.tenant.subscription_plan != "free":
        tier = user.tenant.subscription_plan
    if user.tenant and user.tenant.license_expires_at:
        exp = user.tenant.license_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp > datetime.now(timezone.utc):
            if tier == "free":
                tier = "pro"
    return TIER_FEATURES.get(tier, TIER_FEATURES["free"])


async def check_limit(resource: str, user: User):
    if user.phone in SUPER_ADMIN_PHONES:
        return

    features = get_user_tier_features(user)
    max_val = features.get(f"max_{resource}", -1)
    if max_val < 0:
        return

    async with async_session() as db:
        from sqlalchemy import func

        if resource == "employees":
            count = (await db.execute(
                select(func.count()).select_from(User).where(User.tenant_id == user.tenant_id, User.role != "owner")
            )).scalar()
        elif resource == "stores":
            from sqlalchemy import text
            r = await db.execute(text("SELECT COUNT(*) FROM user_stores WHERE user_id = :uid"), {"uid": user.id})
            count = r.scalar()
        elif resource == "products":
            from app.models.product import Product
            count = (await db.execute(
                select(func.count()).select_from(Product).where(Product.tenant_id == user.tenant_id)
            )).scalar()
        elif resource == "customers":
            from app.models.customer import Customer
            count = (await db.execute(
                select(func.count()).select_from(Customer).where(Customer.tenant_id == user.tenant_id)
            )).scalar()
        else:
            return

        if count >= max_val:
            raise HTTPException(
                status_code=403,
                detail=f"Limite atteinte : {resource} ({count}/{max_val}). Passez au plan supérieur."
            )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    async with async_session() as db:
        result = await db.execute(
            select(User).where(User.id == user_id).options(selectinload(User.tenant))
        )
        user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    if user.phone in SUPER_ADMIN_PHONES:
        return user

    if not user.tenant or not user.tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="licence_expired"
        )

    if user.tenant and user.tenant.license_expires_at:
        expires = user.tenant.license_expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            from app.models.licence import Licence
            lic_result = await db.execute(
                select(Licence).where(Licence.assigned_to == user.tenant_id, Licence.is_active == True)
            )
            active_lic = lic_result.scalar_one_or_none()
            if not active_lic:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="licence_expired"
                )

    return user


async def require_owner(user: User = Depends(get_current_user)) -> User:
    if user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le propriétaire peut effectuer cette action"
        )
    return user
