from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.reports import get_sales_report, get_top_products

router = APIRouter()


@router.get("/sales")
async def sales_report(
    period: str = "daily",
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_sales_report(db, user.tenant_id, period, start_date, end_date)


@router.get("/top-products")
async def top_products(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_top_products(db, user.tenant_id, start_date=start_date, end_date=end_date)
