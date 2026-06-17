from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.supplier import Expense


async def get_sales_report(db: AsyncSession, tenant_id: str, period: str = "daily", start_date: str = None, end_date: str = None) -> dict:
    now = datetime.now(timezone.utc)

    if start_date and end_date:
        start = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
        end = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        label = f"Du {start_date} au {end_date}"
    elif period == "daily":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
        label = "Aujourd'hui"
    elif period == "weekly":
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
        label = "Cette semaine"
    elif period == "monthly":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
        label = "Ce mois"
    else:
        start = now - timedelta(days=365)
        end = now
        label = "Cette année"

    date_filter = [Sale.tenant_id == tenant_id, Sale.created_at >= start, Sale.created_at <= end]

    result = await db.execute(
        select(
            func.count(Sale.id),
            func.coalesce(func.sum(Sale.total_cfa), 0),
        ).where(*date_filter)
    )
    row = result.one()

    cash = await db.execute(
        select(func.coalesce(func.sum(Sale.total_cfa), 0)).where(
            *date_filter, Sale.payment_method == "cash"
        )
    )
    wave = await db.execute(
        select(func.coalesce(func.sum(Sale.total_cfa), 0)).where(
            *date_filter, Sale.payment_method == "wave"
        )
    )
    credit = await db.execute(
        select(func.coalesce(func.sum(Sale.total_cfa), 0)).where(
            *date_filter, Sale.is_credit == True
        )
    )
    om = await db.execute(
        select(func.coalesce(func.sum(Sale.total_cfa), 0)).where(
            *date_filter, Sale.payment_method == "orange_money"
        )
    )

    stock_result = await db.execute(
        select(
            func.count(Product.id),
            func.coalesce(func.sum(Product.stock_quantity * Product.cost_price_cfa), 0),
        ).where(Product.tenant_id == tenant_id, Product.is_active == True)
    )
    stock_row = stock_result.one()

    expense_total = await db.execute(
        select(func.coalesce(func.sum(Expense.amount_cfa), 0)).where(
            Expense.tenant_id == tenant_id,
            Expense.expense_date >= start,
            Expense.expense_date <= end,
        )
    )

    expense_val = int(expense_total.scalar())

    # Net profit = sum of (unit_price - cost_price) * quantity for each sale item - expenses
    margin_result = await db.execute(
        select(
            func.coalesce(
                func.sum((SaleItem.unit_price_cfa - Product.cost_price_cfa) * SaleItem.quantity),
                0,
            )
        )
        .join(Sale, SaleItem.sale_id == Sale.id)
        .join(Product, SaleItem.product_id == Product.id)
        .where(Sale.tenant_id == tenant_id, Sale.created_at >= start, Sale.created_at <= end)
    )
    total_margin = int(margin_result.scalar())

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
        "total_expenses_cfa": expense_val,
        "total_margin_cfa": total_margin,
        "profit_cfa": total_margin - expense_val,
    }


async def get_top_products(db: AsyncSession, tenant_id: str, limit: int = 10, start_date: str = None, end_date: str = None) -> list[dict]:
    now = datetime.now(timezone.utc)
    if start_date and end_date:
        start = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
        end = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    else:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now

    result = await db.execute(
        select(
            SaleItem.product_id,
            func.sum(SaleItem.quantity).label("total_qty"),
            func.sum(SaleItem.total_cfa).label("total_revenue"),
        )
        .join(Sale, SaleItem.sale_id == Sale.id)
        .where(Sale.tenant_id == tenant_id, Sale.created_at >= start, Sale.created_at <= end)
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


async def get_trends(db: AsyncSession, tenant_id: str, days: int = 30) -> dict:
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days)

    result = await db.execute(
        select(
            func.date(Sale.created_at).label("date"),
            func.count(Sale.id).label("sales_count"),
            func.coalesce(func.sum(Sale.total_cfa), 0).label("revenue"),
        )
        .where(Sale.tenant_id == tenant_id, Sale.created_at >= start)
        .group_by(func.date(Sale.created_at))
        .order_by(func.date(Sale.created_at))
    )
    rows = result.all()

    daily_data = [{"date": str(row[0]), "sales_count": row[1], "revenue": int(row[2])} for row in rows]

    total_revenue = sum(d["revenue"] for d in daily_data)
    total_sales = sum(d["sales_count"] for d in daily_data)
    avg_daily_revenue = total_revenue // max(len(daily_data), 1)
    avg_daily_sales = total_sales // max(len(daily_data), 1)

    if len(daily_data) >= 7:
        recent_7 = daily_data[-7:]
        previous_7 = daily_data[-14:-7] if len(daily_data) >= 14 else daily_data[:7]
        recent_avg = sum(d["revenue"] for d in recent_7) / 7
        previous_avg = sum(d["revenue"] for d in previous_7) / max(len(previous_7), 1)
        revenue_trend = ((recent_avg - previous_avg) / max(previous_avg, 1)) * 100
    else:
        revenue_trend = 0

    return {
        "daily_data": daily_data,
        "summary": {
            "total_revenue": total_revenue,
            "total_sales": total_sales,
            "avg_daily_revenue": avg_daily_revenue,
            "avg_daily_sales": avg_daily_sales,
            "revenue_trend_pct": round(revenue_trend, 1),
        },
    }


async def get_period_comparison(
    db: AsyncSession, tenant_id: str,
    p1_start: str, p1_end: str,
    p2_start: str, p2_end: str,
) -> dict:
    start1 = datetime.fromisoformat(p1_start).replace(tzinfo=timezone.utc)
    end1 = datetime.fromisoformat(p1_end).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    start2 = datetime.fromisoformat(p2_start).replace(tzinfo=timezone.utc)
    end2 = datetime.fromisoformat(p2_end).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)

    async def get_period_data(start, end):
        sales_result = await db.execute(
            select(
                func.count(Sale.id),
                func.coalesce(func.sum(Sale.total_cfa), 0),
            ).where(Sale.tenant_id == tenant_id, Sale.created_at >= start, Sale.created_at <= end)
        )
        row = sales_result.one()

        expense_result = await db.execute(
            select(func.coalesce(func.sum(Expense.amount_cfa), 0))
            .where(Expense.tenant_id == tenant_id, Expense.expense_date >= start, Expense.expense_date <= end)
        )
        expenses = int(expense_result.scalar())

        margin_result = await db.execute(
            select(
                func.coalesce(
                    func.sum((SaleItem.unit_price_cfa - Product.cost_price_cfa) * SaleItem.quantity),
                    0,
                )
            )
            .join(Sale, SaleItem.sale_id == Sale.id)
            .join(Product, SaleItem.product_id == Product.id)
            .where(Sale.tenant_id == tenant_id, Sale.created_at >= start, Sale.created_at <= end)
        )
        margin = int(margin_result.scalar())

        return {
            "sales_count": row[0],
            "revenue": int(row[1]),
            "expenses": expenses,
            "profit": margin - expenses,
        }

    period1 = await get_period_data(start1, end1)
    period2 = await get_period_data(start2, end2)

    def calc_change(v1, v2):
        if v2 == 0:
            return 100 if v1 > 0 else 0
        return round(((v1 - v2) / v2) * 100, 1)

    return {
        "period1": period1,
        "period2": period2,
        "changes": {
            "sales_count": calc_change(period1["sales_count"], period2["sales_count"]),
            "revenue": calc_change(period1["revenue"], period2["revenue"]),
            "expenses": calc_change(period1["expenses"], period2["expenses"]),
            "profit": calc_change(period1["profit"], period2["profit"]),
        },
    }
