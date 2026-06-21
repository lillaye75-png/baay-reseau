from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.api.deps import require_owner
from app.models.user import User
from app.services.reports import get_sales_report, get_top_products, get_trends, get_period_comparison

router = APIRouter()


@router.get("/sales")
async def sales_report(
    period: str = "daily",
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    return await get_sales_report(db, user.tenant_id, period, start_date, end_date)


@router.get("/top-products")
async def top_products(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    return await get_top_products(db, user.tenant_id, start_date=start_date, end_date=end_date)


@router.get("/trends")
async def sales_trends(
    days: int = 30,
    user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    return await get_trends(db, user.tenant_id, days)


@router.get("/compare")
async def compare_periods(
    period1_start: str = Query(...),
    period1_end: str = Query(...),
    period2_start: str = Query(...),
    period2_end: str = Query(...),
    user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    return await get_period_comparison(
        db, user.tenant_id,
        period1_start, period1_end,
        period2_start, period2_end,
    )


@router.get("/stock-predictions")
async def stock_predictions(
    user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone, timedelta
    from app.models.product import Product
    from app.models.sale import Sale, SaleItem
    from app.models.order import Order, OrderItem

    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    products_result = await db.execute(
        select(Product).where(Product.tenant_id == user.tenant_id, Product.is_active == True)
    )
    products = list(products_result.scalars().all())

    predictions = []
    for product in products:
        sale_result = await db.execute(
            select(
                func.coalesce(func.sum(SaleItem.quantity), 0).label("total_sold"),
                func.count(SaleItem.id).label("sale_count"),
            )
            .join(Sale, SaleItem.sale_id == Sale.id)
            .where(
                SaleItem.product_id == product.id,
                Sale.tenant_id == user.tenant_id,
                Sale.created_at >= thirty_days_ago,
            )
        )
        sale_data = sale_result.one()
        sale_qty = int(sale_data[0] or 0)

        order_result = await db.execute(
            select(
                func.coalesce(func.sum(OrderItem.quantity), 0).label("total_ordered"),
                func.count(OrderItem.id).label("order_count"),
            )
            .join(Order, OrderItem.order_id == Order.id)
            .where(
                OrderItem.product_id == product.id,
                Order.tenant_id == user.tenant_id,
                Order.created_at >= thirty_days_ago,
                Order.status != "cancelled",
            )
        )
        order_data = order_result.one()
        order_qty = int(order_data[0] or 0)

        total_sold = sale_qty + order_qty
        sale_count = int(sale_data[1] or 0) + int(order_data[1] or 0)

        avg_daily_sales = total_sold / 30 if total_sold > 0 else 0
        days_until_stockout = product.stock_quantity / avg_daily_sales if avg_daily_sales > 0 else 999

        urgency = "low"
        if product.stock_quantity == 0:
            urgency = "critical"
            days_until_stockout = 0
        elif days_until_stockout <= 3:
            urgency = "critical"
        elif days_until_stockout <= 7:
            urgency = "high"
        elif days_until_stockout <= 14:
            urgency = "medium"
        elif product.stock_quantity <= product.low_stock_threshold:
            urgency = "high"
            days_until_stockout = 0

        suggested_reorder = 0
        if avg_daily_sales > 0:
            suggested_reorder = max(int(avg_daily_sales * 30), product.low_stock_threshold * 2)
        elif product.stock_quantity <= product.low_stock_threshold:
            suggested_reorder = product.low_stock_threshold * 3

        predictions.append({
            "product_id": product.id,
            "product_name": product.name,
            "current_stock": product.stock_quantity,
            "avg_daily_sales": round(avg_daily_sales, 1),
            "total_sold_30d": total_sold,
            "sale_count_30d": sale_count,
            "days_until_stockout": round(days_until_stockout, 1),
            "urgency": urgency,
            "suggested_reorder": suggested_reorder,
            "low_stock_threshold": product.low_stock_threshold,
        })

    predictions.sort(key=lambda x: (
        {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(x["urgency"], 4),
        x["days_until_stockout"],
    ))

    critical = [p for p in predictions if p["urgency"] == "critical"]
    high = [p for p in predictions if p["urgency"] == "high"]
    medium = [p for p in predictions if p["urgency"] == "medium"]

    product_price_map = {p.id: p.price_cfa for p in products}

    return {
        "predictions": predictions,
        "summary": {
            "total_products": len(products),
            "critical": len(critical),
            "high": len(high),
            "medium": len(medium),
            "suggested_total_reorder_cfa": sum(
                p["suggested_reorder"] * product_price_map.get(p["product_id"], 0)
                for p in critical + high
            ),
        },
    }
