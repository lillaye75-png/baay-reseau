from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.reports import get_sales_report, get_top_products

router = APIRouter()


@router.get("/sales")
async def sales_report(period: str = "daily", user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_sales_report(db, user.tenant_id, period)


@router.get("/top-products")
async def top_products(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_top_products(db, user.tenant_id)
