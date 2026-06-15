from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user, require_owner
from app.models.user import User
from app.models.tenant import Tenant
from app.models.product import Product, ProductCategory
from app.models.order import Order, OrderItem, StorefrontSettings
from app.schemas.order import (
    OrderCreate, OrderRead, StorefrontSettingsCreate, StorefrontSettingsRead,
    PublicProductRead, PublicStoreRead, OrderItemRead,
)

router = APIRouter()


@router.get("/settings", response_model=StorefrontSettingsRead)
async def get_storefront_settings(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StorefrontSettings).where(StorefrontSettings.tenant_id == user.tenant_id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        settings = StorefrontSettings(tenant_id=user.tenant_id)
        db.add(settings)
        await db.flush()
    return settings


@router.put("/settings", response_model=StorefrontSettingsRead)
async def update_storefront_settings(
    data: StorefrontSettingsCreate,
    user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StorefrontSettings).where(StorefrontSettings.tenant_id == user.tenant_id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        settings = StorefrontSettings(tenant_id=user.tenant_id)
        db.add(settings)
        await db.flush()

    ALLOWED_FIELDS = {"store_name", "store_description", "banner_url", "theme_color", "is_enabled", "delivery_fee_cfa", "min_order_cfa", "accepts_wave", "accepts_orange_money", "accepts_cash_on_delivery", "phone", "whatsapp"}
    for field, value in data.model_dump().items():
        if field in ALLOWED_FIELDS:
            setattr(settings, field, value)
    await db.flush()
    return settings


@router.put("/products/{product_id}/online")
async def toggle_product_online(product_id: str, data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.tenant_id == user.tenant_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_online = data.get("is_online", False)
    await db.flush()
    return {"is_online": product.is_online}


@router.get("/orders", response_model=list[OrderRead])
async def list_orders(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Order)
        .where(Order.tenant_id == user.tenant_id)
        .order_by(Order.created_at.desc())
        .options(selectinload(Order.items))
    )
    return list(result.scalars().all())


@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    from app.models.product import Product
    from app.models.sale import Sale, SaleItem
    from app.services.inventory import update_stock

    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.tenant_id == user.tenant_id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = data.get("status", order.status)
    old_status = order.status

    if new_status == "cancelled" and old_status != "cancelled":
        for item in order.items:
            await update_stock(db, item.product_id, item.quantity)

    if new_status == "delivered" and old_status != "delivered":
        existing_sale = await db.execute(
            select(Sale).where(Sale.payment_reference == f"order:{order.id}")
        )
        if not existing_sale.scalar_one_or_none():
            sale = Sale(
                tenant_id=order.tenant_id,
                total_cfa=order.total_cfa,
                payment_method=order.payment_method,
                payment_reference=f"order:{order.id}",
                is_credit=False,
            )
            db.add(sale)
            await db.flush()
            for item in order.items:
                db.add(SaleItem(
                    sale_id=sale.id,
                    product_id=item.product_id,
                    product_name=item.product_name,
                    quantity=item.quantity,
                    unit_price_cfa=item.unit_price_cfa,
                    total_cfa=item.total_cfa,
                ))

    order.status = new_status
    await db.flush()
    return {"status": order.status}
