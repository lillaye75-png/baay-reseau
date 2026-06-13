from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.customer import Customer


async def get_sales_report(db: AsyncSession, tenant_id: str, period: str = "daily") -> dict:
    now = datetime.now(timezone.utc)

    if period == "daily":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        label = "Aujourd'hui"
    elif period == "weekly":
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        label = "Cette semaine"
    elif period == "monthly":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        label = "Ce mois"
    else:
        start = now - timedelta(days=365)
        label = "Cette année"

    result = await db.execute(
        select(
            func.count(Sale.id),
            func.coalesce(func.sum(Sale.total_cfa), 0),
        ).where(Sale.tenant_id == tenant_id, Sale.created_at >= start)
    )
    row = result.one()

    cash = await db.execute(
        select(func.coalesce(func.sum(Sale.total_cfa), 0)).where(
            Sale.tenant_id == tenant_id, Sale.created_at >= start, Sale.payment_method == "cash"
        )
    )
    wave = await db.execute(
        select(func.coalesce(func.sum(Sale.total_cfa), 0)).where(
            Sale.tenant_id == tenant_id, Sale.created_at >= start, Sale.payment_method == "wave"
        )
    )
    credit = await db.execute(
        select(func.coalesce(func.sum(Sale.total_cfa), 0)).where(
            Sale.tenant_id == tenant_id, Sale.created_at >= start, Sale.is_credit == True
        )
    )
    om = await db.execute(
        select(func.coalesce(func.sum(Sale.total_cfa), 0)).where(
            Sale.tenant_id == tenant_id, Sale.created_at >= start, Sale.payment_method == "orange_money"
        )
    )

    stock_result = await db.execute(
        select(
            func.count(Product.id),
            func.coalesce(func.sum(Product.stock_quantity * Product.cost_price_cfa), 0),
        ).where(Product.tenant_id == tenant_id, Product.is_active == True)
    )
    stock_row = stock_result.one()

    return {
        "period": period,
        "label": label,
        "sales_count": row[0],
        "total_revenue_cfa": int(row[1]),
        "cash_cfa": int(cash.scalar()),
        "wave_cfa": int(wave.scalar()),
        "orange_money_cfa": int(om.scalar()),
        "credit_cfa": int(credit.scalar()),
        "inventory_value_cfa": int(stock_row[1]),
        "total_products": stock_row[0],
    }


async def get_top_products(db: AsyncSession, tenant_id: str, limit: int = 10) -> list[dict]:
    result = await db.execute(
        select(
            SaleItem.product_id,
            func.sum(SaleItem.quantity).label("total_qty"),
            func.sum(SaleItem.total_cfa).label("total_revenue"),
        )
        .join(Sale, SaleItem.sale_id == Sale.id)
        .where(Sale.tenant_id == tenant_id)
        .group_by(SaleItem.product_id)
        .order_by(func.sum(SaleItem.quantity).desc())
        .limit(limit)
    )
    rows = result.all()

    products = []
    for row in rows:
        prod_result = await db.execute(select(Product).where(Product.id == row[0]))
        prod = prod_result.scalar_one_or_none()
        products.append({
            "product_id": row[0],
            "product_name": prod.name if prod else "Unknown",
            "total_qty": row[1],
            "total_revenue": int(row[2]),
        })
    return products
