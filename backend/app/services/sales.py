from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.credit_tab import CreditTab, CreditTabEntry
from app.schemas.sale import SaleCreate
from app.services.inventory import update_stock


async def create_sale(db: AsyncSession, tenant_id: str, data: SaleCreate) -> Sale:
    total = sum(item.quantity * item.unit_price_cfa for item in data.items)

    sale = Sale(
        tenant_id=tenant_id,
        customer_id=data.customer_id,
        total_cfa=total,
        payment_method=data.payment_method,
        payment_reference=data.payment_reference,
        is_credit=data.is_credit,
    )
    db.add(sale)
    await db.flush()

    for item_data in data.items:
        item_total = item_data.quantity * item_data.unit_price_cfa
        product_result = await db.execute(
            select(Product).where(Product.id == item_data.product_id, Product.tenant_id == tenant_id)
        )
        product = product_result.scalar_one_or_none()
        if not product:
            raise ValueError(f"Product {item_data.product_id} not found or not owned by tenant")
        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=item_data.product_id,
            product_name=product.name if product else "",
            quantity=item_data.quantity,
            unit_price_cfa=item_data.unit_price_cfa,
            total_cfa=item_total,
        )
        db.add(sale_item)
        await update_stock(db, item_data.product_id, -item_data.quantity)

    if data.is_credit and data.customer_id:
        result = await db.execute(
            select(CreditTab).where(
                CreditTab.customer_id == data.customer_id,
                CreditTab.is_active == True,
            )
        )
        tab = result.scalar_one_or_none()
        if not tab:
            tab = CreditTab(customer_id=data.customer_id)
            db.add(tab)
            await db.flush()

        tab.balance_cfa += total
        entry = CreditTabEntry(
            tab_id=tab.id,
            amount_cfa=total,
            description=f"Vente à crédit",
            sale_id=sale.id,
        )
        db.add(entry)

        customer_result = await db.execute(select(Customer).where(Customer.id == data.customer_id))
        customer = customer_result.scalar_one()
        customer.total_credit_cfa += total

    await db.flush()

    result = await db.execute(
        select(Sale).where(Sale.id == sale.id).options(
            selectinload(Sale.items).selectinload(SaleItem.product),
            selectinload(Sale.customer),
        )
    )
    return result.scalar_one()


async def get_sales(db: AsyncSession, tenant_id: str, limit: int = 50) -> list[Sale]:
    result = await db.execute(
        select(Sale)
        .where(Sale.tenant_id == tenant_id)
        .order_by(Sale.created_at.desc())
        .limit(limit)
        .options(
            selectinload(Sale.items).selectinload(SaleItem.product),
            selectinload(Sale.customer),
        )
    )
    return list(result.scalars().all())


async def get_daily_revenue(db: AsyncSession, tenant_id: str) -> dict:
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    result = await db.execute(
        select(
            func.count(Sale.id),
            func.coalesce(func.sum(Sale.total_cfa), 0),
        ).where(
            Sale.tenant_id == tenant_id,
            Sale.created_at >= today,
        )
    )
    row = result.one()

    cash_result = await db.execute(
        select(func.coalesce(func.sum(Sale.total_cfa), 0)).where(
            Sale.tenant_id == tenant_id,
            Sale.created_at >= today,
            Sale.payment_method == "cash",
        )
    )
    wave_result = await db.execute(
        select(func.coalesce(func.sum(Sale.total_cfa), 0)).where(
            Sale.tenant_id == tenant_id,
            Sale.created_at >= today,
            Sale.payment_method == "wave",
        )
    )
    credit_result = await db.execute(
        select(func.coalesce(func.sum(Sale.total_cfa), 0)).where(
            Sale.tenant_id == tenant_id,
            Sale.created_at >= today,
            Sale.is_credit == True,
        )
    )

    return {
        "total_sales": row[0],
        "total_revenue_cfa": int(row[1]),
        "cash_cfa": int(cash_result.scalar()),
        "wave_cfa": int(wave_result.scalar()),
        "credit_cfa": int(credit_result.scalar()),
    }


async def get_weekly_revenue(db: AsyncSession, tenant_id: str) -> list[dict]:
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    days = []
    for i in range(6, -1, -1):
        day_start = today - timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        result = await db.execute(
            select(
                func.count(Sale.id),
                func.coalesce(func.sum(Sale.total_cfa), 0),
            ).where(
                Sale.tenant_id == tenant_id,
                Sale.created_at >= day_start,
                Sale.created_at < day_end,
            )
        )
        row = result.one()
        days.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "day": day_start.strftime("%a"),
            "sales": row[0],
            "revenue": int(row[1]),
        })
    return days


async def pay_credit(db: AsyncSession, tenant_id: str, customer_id: str, amount: int, description: str = None) -> dict:
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == tenant_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise ValueError("Customer not found")

    tab_result = await db.execute(
        select(CreditTab).where(
            CreditTab.customer_id == customer_id,
            CreditTab.is_active == True,
        )
    )
    tab = tab_result.scalar_one_or_none()
    if not tab or tab.balance_cfa <= 0:
        raise ValueError("No active credit tab")

    actual = min(amount, tab.balance_cfa)
    tab.balance_cfa -= actual
    customer.total_credit_cfa = max(0, customer.total_credit_cfa - actual)

    entry = CreditTabEntry(
        tab_id=tab.id,
        amount_cfa=-actual,
        description=description or "Remboursement",
    )
    db.add(entry)

    if tab.balance_cfa == 0:
        tab.is_active = False

    await db.flush()
    return {"paid": actual, "remaining": tab.balance_cfa}


async def update_sale(db: AsyncSession, tenant_id: str, sale_id: str, data) -> Sale:
    result = await db.execute(
        select(Sale).where(Sale.id == sale_id, Sale.tenant_id == tenant_id)
        .options(selectinload(Sale.items).selectinload(SaleItem.product))
    )
    sale = result.scalar_one_or_none()
    if not sale:
        raise ValueError("Sale not found")

    for old_item in sale.items:
        await update_stock(db, old_item.product_id, old_item.quantity)

    from sqlalchemy import delete as sa_del
    await db.execute(sa_del(SaleItem).where(SaleItem.sale_id == sale.id))

    new_total = sum(item.quantity * item.unit_price_cfa for item in data.items)
    sale.total_cfa = new_total
    sale.payment_method = data.payment_method
    sale.is_credit = data.is_credit
    sale.customer_id = data.customer_id

    for item_data in data.items:
        item_total = item_data.quantity * item_data.unit_price_cfa
        product_result = await db.execute(
            select(Product).where(Product.id == item_data.product_id, Product.tenant_id == tenant_id)
        )
        product = product_result.scalar_one_or_none()
        if not product:
            raise ValueError(f"Product {item_data.product_id} not found or not owned by tenant")
        db.add(SaleItem(
            sale_id=sale.id,
            product_id=item_data.product_id,
            product_name=product.name if product else "",
            quantity=item_data.quantity,
            unit_price_cfa=item_data.unit_price_cfa,
            total_cfa=item_total,
        ))
        await update_stock(db, item_data.product_id, -item_data.quantity)

    await db.flush()
    result = await db.execute(
        select(Sale).where(Sale.id == sale.id)
        .options(selectinload(Sale.items).selectinload(SaleItem.product), selectinload(Sale.customer))
    )
    return result.scalar_one()


async def delete_sale(db: AsyncSession, tenant_id: str, sale_id: str) -> dict:
    result = await db.execute(
        select(Sale).where(Sale.id == sale_id, Sale.tenant_id == tenant_id)
        .options(selectinload(Sale.items))
    )
    sale = result.scalar_one_or_none()
    if not sale:
        raise ValueError("Sale not found")

    for item in sale.items:
        await update_stock(db, item.product_id, item.quantity)

    from sqlalchemy import delete as sa_del
    await db.execute(sa_del(SaleItem).where(SaleItem.sale_id == sale.id))
    await db.delete(sale)
    await db.flush()
    return {"status": "deleted", "stock_restored": True}


async def create_quick_sale(db: AsyncSession, tenant_id: str, data) -> Sale:
    total = data.quantity * data.unit_price_cfa

    sale = Sale(
        tenant_id=tenant_id,
        customer_id=data.customer_id,
        total_cfa=total,
        payment_method=data.payment_method,
        payment_reference=data.payment_reference,
        is_credit=data.is_credit,
    )
    db.add(sale)
    await db.flush()

    from sqlalchemy import text
    import uuid
    item_id = str(uuid.uuid4())
    await db.execute(text(
        "INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price_cfa, total_cfa) "
        "VALUES (:id, :sale_id, NULL, :product_name, :quantity, :unit_price_cfa, :total_cfa)"
    ), {
        "id": item_id, "sale_id": sale.id, "product_name": data.product_name,
        "quantity": data.quantity, "unit_price_cfa": data.unit_price_cfa, "total_cfa": total,
    })

    if data.is_credit and data.customer_id:
        result = await db.execute(
            select(CreditTab).where(
                CreditTab.customer_id == data.customer_id,
                CreditTab.is_active == True,
            )
        )
        tab = result.scalar_one_or_none()
        if not tab:
            tab = CreditTab(customer_id=data.customer_id)
            db.add(tab)
            await db.flush()

        tab.balance_cfa += total
        entry = CreditTabEntry(
            tab_id=tab.id,
            amount_cfa=total,
            description=f"Vente rapide",
            sale_id=sale.id,
        )
        db.add(entry)

        customer_result = await db.execute(select(Customer).where(Customer.id == data.customer_id))
        customer = customer_result.scalar_one_or_none()
        if customer:
            customer.total_credit_cfa += total

    await db.flush()

    result = await db.execute(
        select(Sale).where(Sale.id == sale.id).options(
            selectinload(Sale.items),
            selectinload(Sale.customer),
        )
    )
    return result.scalar_one()
