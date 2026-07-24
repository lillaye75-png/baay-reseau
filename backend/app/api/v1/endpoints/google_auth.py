import httpx
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone, timedelta

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, hash_password
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.user import UserRead, Token
from app.api.deps import SUPER_ADMIN_PHONES

router = APIRouter()


def _token_response(user: User, access_token: str, refresh: str) -> Token:
    user_data = UserRead.model_validate(user)
    user_data.is_super_admin = user.phone in SUPER_ADMIN_PHONES
    return Token(access_token=access_token, refresh_token=refresh, user=user_data)


@router.post("/google", response_model=Token)
async def google_login(data: dict, db: AsyncSession = Depends(get_db)):
    code = data.get("code", "")
    if not code:
        raise HTTPException(status_code=400, detail="Code d'autorisation Google requis")

    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="Google OAuth non configuré")

    redirect_uri = data.get("redirect_uri", "")

    try:
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
                timeout=15,
            )
    except Exception:
        raise HTTPException(status_code=502, detail="Impossible de contacter Google. Réessayez.")

    if token_resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Code Google invalide ou expiré")

    access_token = token_resp.json().get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Pas de token d'accès Google")

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
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
    phone_google = f"goog:{google_id[:12]}"
    slug = f"shop-{google_id[:8]}"

    if not email:
        raise HTTPException(status_code=401, detail="Email non trouvé dans le token Google")

    result = await db.execute(
        select(User).where((User.email == email) | (User.phone == phone_google))
    )
    user = result.scalar_one_or_none()

    if user:
        if not user.email:
            user.email = email
        if user.name != name:
            user.name = name
        await db.flush()
        access_token = create_access_token(data={"sub": str(user.id), "tenant_id": str(user.tenant_id)})
        refresh = create_refresh_token(data={"sub": str(user.id), "tenant_id": str(user.tenant_id)})
        return _token_response(user, access_token, refresh)

    try:
        tenant = Tenant(
            name=f"{name}'s Shop",
            slug=slug,
            phone=phone_google,
            email=email,
            subscription_plan="free",
            license_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        db.add(tenant)
        await db.flush()

        user = User(
            tenant_id=tenant.id,
            name=name,
            phone=phone_google,
            email=email,
            password_hash=hash_password(google_id),
            role="owner",
        )
        db.add(user)
        await db.flush()

        await db.execute(
            text("INSERT INTO user_stores (id, user_id, tenant_id, is_default) VALUES (:id, :user_id, :tenant_id, 1)"),
            {"id": str(uuid.uuid4()), "user_id": user.id, "tenant_id": tenant.id},
        )

        access_token = create_access_token(data={"sub": str(user.id), "tenant_id": str(user.tenant_id)})
        refresh = create_refresh_token(data={"sub": str(user.id), "tenant_id": str(user.tenant_id)})
        return _token_response(user, access_token, refresh)

    except IntegrityError as e:
        await db.rollback()
        result = await db.execute(
            select(User).where((User.email == email) | (User.phone == phone_google))
        )
        user = result.scalar_one_or_none()
        if not user:
            result = await db.execute(select(Tenant).where(Tenant.slug == slug))
            tenant = result.scalar_one_or_none()
            if tenant:
                user = User(
                    tenant_id=tenant.id,
                    name=name,
                    phone=phone_google,
                    email=email,
                    password_hash=hash_password(google_id),
                    role="owner",
                )
                db.add(user)
                await db.flush()

                await db.execute(
                    text("INSERT INTO user_stores (id, user_id, tenant_id, is_default) VALUES (:id, :user_id, :tenant_id, 1)"),
                    {"id": str(uuid.uuid4()), "user_id": user.id, "tenant_id": tenant.id},
                )
        if not user:
            raise HTTPException(status_code=500, detail=f"Erreur création compte Google (IntegrityError): {str(e)}")
        access_token = create_access_token(data={"sub": str(user.id), "tenant_id": str(user.tenant_id)})
        refresh = create_refresh_token(data={"sub": str(user.id), "tenant_id": str(user.tenant_id)})
        return _token_response(user, access_token, refresh)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur création compte Google: {str(e)}")
