import random
import string
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.tenant import Tenant

router = APIRouter()

REFERRAL_CREDIT_CFA = 5000


def generate_referral_code() -> str:
    return "BR" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


@router.get("/code")
async def get_referral_code(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        return {"code": None}

    if not tenant.referral_code:
        tenant.referral_code = generate_referral_code()
        await db.flush()

    return {
        "code": tenant.referral_code,
        "credits": tenant.referral_credits,
        "link": f"http://localhost:3000/register?ref={tenant.referral_code}",
    }


@router.post("/apply")
async def apply_referral_code(
    code: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        return {"error": "Tenant not found"}

    if tenant.referred_by:
        return {"error": "Already referred by another shop"}

    referrer_result = await db.execute(
        select(Tenant).where(Tenant.referral_code == code, Tenant.id != tenant.id)
    )
    referrer = referrer_result.scalar_one_or_none()
    if not referrer:
        return {"error": "Invalid referral code"}

    tenant.referred_by = referrer.id
    tenant.referral_credits += REFERRAL_CREDIT_CFA
    referrer.referral_credits += REFERRAL_CREDIT_CFA
    await db.flush()

    return {"success": True, "credits_earned": REFERRAL_CREDIT_CFA}


@router.get("/stats")
async def referral_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        return {"referrals": 0, "credits": 0}

    referrals_result = await db.execute(
        select(Tenant).where(Tenant.referred_by == tenant.id)
    )
    referral_count = len(referrals_result.scalars().all())

    return {
        "code": tenant.referral_code,
        "referral_count": referral_count,
        "total_credits": tenant.referral_credits,
        "credits_value_cfa": tenant.referral_credits,
    }
