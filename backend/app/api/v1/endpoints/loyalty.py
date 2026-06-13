from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.customer import Customer
from app.models.loyalty import LoyaltyPoint

router = APIRouter()

POINTS_PER_1000_CFA = 1


@router.get("/customer/{customer_id}")
async def get_loyalty_points(
    customer_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == user.tenant_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        return {"points": 0, "history": []}

    history_result = await db.execute(
        select(LoyaltyPoint)
        .where(LoyaltyPoint.customer_id == customer_id)
        .order_by(LoyaltyPoint.created_at.desc())
        .limit(20)
    )
    history = [
        {
            "id": h.id,
            "points": h.points,
            "reason": h.reason,
            "created_at": h.created_at.isoformat(),
        }
        for h in history_result.scalars().all()
    ]

    return {
        "customer_id": customer_id,
        "total_points": customer.loyalty_points,
        "redeemable_value_cfa": customer.loyalty_points * 100,
        "history": history,
    }


@router.post("/earn")
async def earn_points(
    customer_id: str,
    sale_amount_cfa: int,
    sale_id: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == user.tenant_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        return {"error": "Customer not found"}

    points = sale_amount_cfa // 1000 * POINTS_PER_1000_CFA
    if points <= 0:
        return {"points_earned": 0, "reason": "Amount too small"}

    customer.loyalty_points += points

    entry = LoyaltyPoint(
        tenant_id=user.tenant_id,
        customer_id=customer_id,
        sale_id=sale_id,
        points=points,
        reason=f"Achat de {sale_amount_cfa:,} CFA",
    )
    db.add(entry)
    await db.flush()

    return {"points_earned": points, "total_points": customer.loyalty_points}


@router.post("/redeem")
async def redeem_points(
    customer_id: str,
    points: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == user.tenant_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        return {"error": "Customer not found"}

    if customer.loyalty_points < points:
        return {"error": "Insufficient points"}

    customer.loyalty_points -= points
    discount_cfa = points * 100

    entry = LoyaltyPoint(
        tenant_id=user.tenant_id,
        customer_id=customer_id,
        points=-points,
        reason=f"Remise de {discount_cfa:,} CFA",
    )
    db.add(entry)
    await db.flush()

    return {"points_redeemed": points, "discount_cfa": discount_cfa, "remaining_points": customer.loyalty_points}
