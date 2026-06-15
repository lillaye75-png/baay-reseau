from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import get_current_user, require_owner
from app.models.user import User
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.schemas.sale import SaleCreate, SaleRead
from app.services.sales import create_sale, get_sales, get_daily_revenue, get_weekly_revenue
from app.integrations.payments import create_wave_checkout, create_orange_money_link, get_qr_svg

router = APIRouter()


@router.get("/", response_model=list[SaleRead])
async def list_sales(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_sales(db, user.tenant_id)


@router.get("/stats/weekly")
async def weekly_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_weekly_revenue(db, user.tenant_id)


@router.get("/{sale_id}", response_model=SaleRead)
async def get_sale(sale_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models.customer import Customer
    result = await db.execute(
        select(Sale).where(Sale.id == sale_id, Sale.tenant_id == user.tenant_id)
        .options(
            selectinload(Sale.items).selectinload(SaleItem.product),
            selectinload(Sale.customer),
        )
    )
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.post("/", response_model=SaleRead, status_code=201)
async def create_new_sale(data: SaleCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await create_sale(db, user.tenant_id, data)


@router.post("/{product_id}/adjust-stock")
async def adjust_stock(product_id: str, data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.inventory import update_stock
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.tenant_id == user.tenant_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    adjustment = data.get("quantity", 0)
    updated = await update_stock(db, product_id, adjustment)
    return {"stock_quantity": updated.stock_quantity}


@router.post("/payment-link/wave")
async def generate_wave_link(data: dict, user: User = Depends(get_current_user)):
    amount = data.get("amount", 0)
    phone = data.get("phone", "")
    order_id = data.get("order_id", f"order-{user.id[:8]}")
    result = await create_wave_checkout(amount, phone, order_id)
    if "payment_url" in result:
        result["qr_url"] = get_qr_svg(result["payment_url"])
    return result


@router.post("/payment-link/orange-money")
async def generate_orange_money_link(data: dict, user: User = Depends(get_current_user)):
    amount = data.get("amount", 0)
    phone = data.get("phone", "")
    order_id = data.get("order_id", f"order-{user.id[:8]}")
    result = await create_orange_money_link(amount, phone, order_id)
    if "payment_url" in result:
        result["qr_url"] = get_qr_svg(result["payment_url"])
    return result


@router.put("/{sale_id}", response_model=SaleRead)
async def update_sale(sale_id: str, data: SaleCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.sales import update_sale as update_sale_svc
    try:
        return await update_sale_svc(db, user.tenant_id, sale_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{sale_id}")
async def delete_sale(sale_id: str, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    from app.services.sales import delete_sale as delete_sale_svc
    try:
        return await delete_sale_svc(db, user.tenant_id, sale_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
