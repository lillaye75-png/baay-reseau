import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, hash_password
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.user import UserRead, Token

router = APIRouter()


@router.post("/google", response_model=Token)
async def google_login(data: dict, db: AsyncSession = Depends(get_db)):
    token = data.get("token", "")
    if not token:
        raise HTTPException(status_code=400, detail="Token Google requis")

    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth non configuré")

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"},
                timeout=15,
            )
    except Exception:
        raise HTTPException(status_code=502, detail="Impossible de contacter Google. Réessayez.")

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Token Google invalide ou expiré")

    google_data = resp.json()
    email = google_data.get("email", "")
    name = google_data.get("name", "")
    google_id = google_data.get("sub", "")

    if not email:
        raise HTTPException(status_code=401, detail="Email non trouvé dans le token Google")

    try:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
    except Exception:
        raise HTTPException(status_code=500, detail="Erreur base de données")

    if user:
        access_token = create_access_token(data={"sub": str(user.id), "tenant_id": str(user.tenant_id)})
        refresh = create_refresh_token(data={"sub": str(user.id), "tenant_id": str(user.tenant_id)})
        return Token(access_token=access_token, refresh_token=refresh, user=UserRead.model_validate(user))

    result = await db.execute(select(User).where(User.phone == f"google:{google_id}"))
    user = result.scalar_one_or_none()

    if user:
        user.email = email
        await db.flush()
        access_token = create_access_token(data={"sub": str(user.id), "tenant_id": str(user.tenant_id)})
        refresh = create_refresh_token(data={"sub": str(user.id), "tenant_id": str(user.tenant_id)})
        return Token(access_token=access_token, refresh_token=refresh, user=UserRead.model_validate(user))

    try:
        tenant = Tenant(
            name=f"{name}'s Shop",
            slug=f"shop-{google_id[:8]}",
            phone=f"google:{google_id}",
            email=email,
            subscription_plan="free",
            license_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        db.add(tenant)
        await db.flush()

        user = User(
            tenant_id=tenant.id,
            name=name,
            phone=f"google:{google_id}",
            email=email,
            password_hash=hash_password(google_id),
            role="owner",
        )
        db.add(user)
        await db.flush()
    except Exception:
        raise HTTPException(status_code=500, detail="Erreur création compte Google")

    access_token = create_access_token(data={"sub": str(user.id), "tenant_id": str(tenant.id)})
    refresh = create_refresh_token(data={"sub": str(user.id), "tenant_id": str(tenant.id)})
    return Token(access_token=access_token, refresh_token=refresh, user=UserRead.model_validate(user))
