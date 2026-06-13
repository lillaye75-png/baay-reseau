from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.supplier import Supplier, PurchaseOrder, PurchaseOrderItem, Expense
from app.models.product import Product

router = APIRouter()


@router.get("/suppliers")
async def list_suppliers(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Supplier).where(Supplier.tenant_id == user.tenant_id))
    return list(result.scalars().all())


@router.post("/suppliers", status_code=201)
async def create_supplier(data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    supplier = Supplier(tenant_id=user.tenant_id, **data)
    db.add(supplier)
    await db.flush()
    return supplier


@router.put("/suppliers/{supplier_id}")
async def update_supplier(supplier_id: str, data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id, Supplier.tenant_id == user.tenant_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for field, value in data.items():
        setattr(supplier, field, value)
    await db.flush()
    return supplier


@router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id, Supplier.tenant_id == user.tenant_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    await db.delete(supplier)
    await db.flush()
    return {"status": "deleted"}


@router.get("/purchase-orders")
async def list_purchase_orders(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PurchaseOrder)
        .where(PurchaseOrder.tenant_id == user.tenant_id)
        .order_by(PurchaseOrder.created_at.desc())
        .options(selectinload(PurchaseOrder.items), selectinload(PurchaseOrder.supplier))
    )
    return list(result.scalars().all())


@router.post("/purchase-orders", status_code=201)
async def create_purchase_order(data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    items_data = data.get("items", [])
    total = sum(i.get("quantity", 1) * i.get("unit_cost_cfa", 0) for i in items_data)

    po = PurchaseOrder(
        tenant_id=user.tenant_id,
        supplier_id=data.get("supplier_id"),
        total_cfa=total,
        notes=data.get("notes"),
    )
    db.add(po)
    await db.flush()

    for item in items_data:
        item_total = item.get("quantity", 1) * item.get("unit_cost_cfa", 0)
        db.add(PurchaseOrderItem(
            purchase_order_id=po.id,
            product_id=item.get("product_id"),
            product_name=item.get("product_name", ""),
            quantity=item.get("quantity", 1),
            unit_cost_cfa=item.get("unit_cost_cfa", 0),
            total_cfa=item_total,
        ))

    await db.flush()
    return po


@router.put("/purchase-orders/{po_id}/status")
async def update_po_status(po_id: str, data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PurchaseOrder).where(PurchaseOrder.id == po_id, PurchaseOrder.tenant_id == user.tenant_id)
        .options(selectinload(PurchaseOrder.items))
    )
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    new_status = data.get("status", po.status)

    if new_status == "received" and po.status != "received":
        from app.services.inventory import update_stock
        for item in po.items:
            if item.product_id:
                await update_stock(db, item.product_id, item.quantity)

    po.status = new_status
    await db.flush()
    return {"status": po.status}


EXPENSE_CATEGORIES = [
    "Loyer", "Électricité", "Eau", "Internet", "Salaires", "Transport",
    "Fournitures", "Maintenance", "Marketing", "Autre",
]


@router.get("/expenses/categories")
async def get_expense_categories():
    return EXPENSE_CATEGORIES


@router.get("/expenses")
async def list_expenses(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Expense).where(Expense.tenant_id == user.tenant_id).order_by(Expense.expense_date.desc())
    )
    return list(result.scalars().all())


@router.post("/expenses", status_code=201)
async def create_expense(data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    expense = Expense(
        tenant_id=user.tenant_id,
        category=data.get("category", "Autre"),
        description=data.get("description", ""),
        amount_cfa=data.get("amount_cfa", 0),
        expense_date=datetime.fromisoformat(data.get("expense_date", datetime.now().isoformat())),
    )
    db.add(expense)
    await db.flush()
    return expense


@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Expense).where(Expense.id == expense_id, Expense.tenant_id == user.tenant_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    await db.delete(expense)
    await db.flush()
    return {"status": "deleted"}


@router.get("/expenses/summary")
async def expense_summary(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    result = await db.execute(
        select(Expense.category, func.sum(Expense.amount_cfa))
        .where(Expense.tenant_id == user.tenant_id, Expense.expense_date >= month_start)
        .group_by(Expense.category)
    )
    categories = [{"category": row[0], "total_cfa": int(row[1])} for row in result.all()]

    total_result = await db.execute(
        select(func.coalesce(func.sum(Expense.amount_cfa), 0))
        .where(Expense.tenant_id == user.tenant_id, Expense.expense_date >= month_start)
    )
    total = int(total_result.scalar())

    return {"month_total_cfa": total, "by_category": categories}
