from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.inventory import get_inventory_summary
from app.services.sales import get_daily_revenue
from app.services.alerts import check_and_send_stock_alerts, check_and_send_debt_alerts

router = APIRouter()


@router.get("/summary")
async def dashboard_summary(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    inventory = await get_inventory_summary(db, user.tenant_id)
    revenue = await get_daily_revenue(db, user.tenant_id)

    from sqlalchemy import select, func
    from app.models.customer import Customer

    credit_result = await db.execute(
        select(func.coalesce(func.sum(Customer.total_credit_cfa), 0)).where(
            Customer.tenant_id == user.tenant_id,
            Customer.total_credit_cfa > 0,
        )
    )
    debtors_result = await db.execute(
        select(func.count(Customer.id)).where(
            Customer.tenant_id == user.tenant_id,
            Customer.total_credit_cfa > 0,
        )
    )

    return {
        "inventory": inventory,
        "revenue": revenue,
        "credit": {
            "total_outstanding_cfa": int(credit_result.scalar()),
            "total_debtors": debtors_result.scalar(),
        },
    }


@router.post("/alerts/stock")
async def trigger_stock_alerts(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await check_and_send_stock_alerts(db, user.tenant_id)


@router.post("/alerts/debt")
async def trigger_debt_alerts(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await check_and_send_debt_alerts(db, user.tenant_id)
