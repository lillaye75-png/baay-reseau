from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.core.security import decode_access_token
from app.core.database import async_session
from app.models.user import User

security = HTTPBearer()


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
            async with async_session() as db:
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
