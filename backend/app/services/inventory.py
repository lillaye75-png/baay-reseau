from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product


async def get_low_stock_products(db: AsyncSession, tenant_id: str) -> list[Product]:
    result = await db.execute(
        select(Product).where(
            Product.tenant_id == tenant_id,
            Product.is_active == True,
            Product.stock_quantity <= Product.low_stock_threshold,
        )
    )
    return list(result.scalars().all())


async def update_stock(db: AsyncSession, product_id: str, quantity_change: int) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one()
    product.stock_quantity += quantity_change
    if product.stock_quantity < 0:
        product.stock_quantity = 0
    await db.flush()
    return product


async def get_inventory_summary(db: AsyncSession, tenant_id: str) -> dict:
    result = await db.execute(
        select(
            func.count(Product.id),
            func.coalesce(func.sum(Product.stock_quantity * Product.price_cfa), 0),
        ).where(Product.tenant_id == tenant_id, Product.is_active == True)
    )
    row = result.one()
    low_stock = await get_low_stock_products(db, tenant_id)
    return {
        "total_products": row[0],
        "total_stock_value_cfa": int(row[1]),
        "low_stock_count": len(low_stock),
        "low_stock_products": [
            {"id": p.id, "name": p.name, "stock": p.stock_quantity, "threshold": p.low_stock_threshold}
            for p in low_stock
        ],
    }
