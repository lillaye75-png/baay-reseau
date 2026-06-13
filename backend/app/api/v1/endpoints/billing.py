from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from app.services.billing import PLANS, get_plan_features, create_stripe_customer, create_checkout_session, create_billing_portal, handle_stripe_webhook

router = APIRouter()


@router.get("/plans")
async def get_plans():
    return {
        plan_id: {
            "id": plan_id,
            "name": info["name"],
            "price_cfa": info["price_cfa"],
            "features": info["features"],
        }
        for plan_id, info in PLANS.items()
    }


@router.get("/current")
async def get_current_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        return {"plan": "free", "status": "active"}

    features = get_plan_features(tenant.subscription_plan)
    return {
        "plan": tenant.subscription_plan,
        "status": tenant.subscription_status,
        "expires_at": tenant.subscription_expires_at.isoformat() if tenant.subscription_expires_at else None,
        "features": features,
        "has_stripe": bool(tenant.stripe_customer_id),
    }


@router.post("/checkout")
async def create_checkout(
    plan: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if plan not in PLANS or plan == "free":
        return {"url": None}

    result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        return {"error": "Tenant not found"}

    if not tenant.stripe_customer_id:
        customer_id = await create_stripe_customer(
            email=tenant.email or f"{tenant.phone}@baay-reseau.com",
            name=tenant.name,
        )
        if customer_id:
            tenant.stripe_customer_id = customer_id
            await db.flush()

    if not tenant.stripe_customer_id:
        return {"error": "Stripe not configured", "demo_mode": True, "plan": plan}

    url = await create_checkout_session(
        customer_id=tenant.stripe_customer_id,
        plan=plan,
        success_url=f"http://localhost:3000/settings?billing=success",
        cancel_url=f"http://localhost:3000/settings?billing=cancelled",
    )

    if not url:
        tenant.subscription_plan = plan
        tenant.subscription_status = "active"
        await db.flush()
        return {"demo_mode": True, "plan": plan, "message": "Plan activé (mode démo)"}

    return {"url": url}


@router.post("/portal")
async def billing_portal(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant or not tenant.stripe_customer_id:
        return {"url": None}

    url = await create_billing_portal(
        customer_id=tenant.stripe_customer_id,
        return_url="http://localhost:3000/settings",
    )
    return {"url": url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    result = await handle_stripe_webhook(payload, sig_header)

    if result["status"] == "subscription_created":
        tenant_result = await db.execute(
            select(Tenant).where(Tenant.stripe_customer_id == result["customer_id"])
        )
        tenant = tenant_result.scalar_one_or_none()
        if tenant:
            tenant.stripe_subscription_id = result["subscription_id"]
            tenant.subscription_plan = result.get("plan", "pro")
            tenant.subscription_status = "active"
            await db.flush()

    return {"status": "ok"}
