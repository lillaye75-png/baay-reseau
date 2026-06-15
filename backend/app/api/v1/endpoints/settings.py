from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.core.database import get_db
from app.api.deps import require_owner
from app.models.user import User
from app.models.tenant import Tenant
from app.models.product import Product, ProductCategory
from app.models.product_image import ProductImage
from app.models.customer import Customer
from app.models.sale import Sale, SaleItem
from app.models.order import Order, OrderItem
from app.models.supplier import Supplier, PurchaseOrder, PurchaseOrderItem, Expense
from app.models.credit_tab import CreditTab, CreditTabEntry

router = APIRouter()


@router.get("/backup")
async def backup_data(user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    tenant_id = user.tenant_id

    products = (await db.execute(select(Product).where(Product.tenant_id == tenant_id))).scalars().all()
    categories = (await db.execute(select(ProductCategory).where(ProductCategory.tenant_id == tenant_id))).scalars().all()
    customers = (await db.execute(select(Customer).where(Customer.tenant_id == tenant_id))).scalars().all()
    sales = (await db.execute(select(Sale).where(Sale.tenant_id == tenant_id))).scalars().all()
    suppliers = (await db.execute(select(Supplier).where(Supplier.tenant_id == tenant_id))).scalars().all()
    expenses = (await db.execute(select(Expense).where(Expense.tenant_id == tenant_id))).scalars().all()

    from datetime import datetime, date
    data = {
        "exported_at": str(datetime.utcnow()),
        "tenant": {"name": user.tenant.name, "slug": user.tenant.slug, "phone": user.tenant.phone, "email": user.tenant.email},
        "products": [{"name": p.name, "sku": p.sku, "description": p.description, "price_cfa": p.price_cfa, "cost_price_cfa": p.cost_price_cfa, "stock_quantity": p.stock_quantity, "low_stock_threshold": p.low_stock_threshold, "unit": p.unit, "barcode": p.barcode, "is_online": p.is_online, "category_name": None} for p in products],
        "categories": [{"name": c.name, "name_wo": c.name_wo} for c in categories],
        "customers": [{"name": c.name, "phone": c.phone, "total_credit_cfa": c.total_credit_cfa} for c in customers],
        "sales": [{"total_cfa": s.total_cfa, "payment_method": s.payment_method, "is_credit": s.is_credit, "created_at": str(s.created_at)} for s in sales],
        "suppliers": [{"name": s.name, "phone": s.phone} for s in suppliers],
        "expenses": [{"category": e.category, "description": e.description, "amount_cfa": e.amount_cfa, "expense_date": str(e.expense_date)} for e in expenses],
    }

    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f"attachment; filename=baay-backup-{date.today()}.json"},
    )


@router.post("/restore")
async def restore_data(data: dict, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    tenant_id = user.tenant_id

    for cat_data in data.get("categories", []):
        cat = ProductCategory(tenant_id=tenant_id, name=cat_data["name"], name_wo=cat_data.get("name_wo"))
        db.add(cat)
    await db.flush()

    cat_map = {}
    cats = (await db.execute(select(ProductCategory).where(ProductCategory.tenant_id == tenant_id))).scalars().all()
    for c in cats:
        cat_map[c.name] = c.id

    for p_data in data.get("products", []):
        product = Product(
            tenant_id=tenant_id,
            name=p_data["name"],
            sku=p_data.get("sku"),
            description=p_data.get("description"),
            price_cfa=p_data.get("price_cfa", 0),
            cost_price_cfa=p_data.get("cost_price_cfa", 0),
            stock_quantity=p_data.get("stock_quantity", 0),
            low_stock_threshold=p_data.get("low_stock_threshold", 5),
            unit=p_data.get("unit", "piece"),
            barcode=p_data.get("barcode"),
            is_online=p_data.get("is_online", True),
            category_id=cat_map.get(p_data.get("category_name")),
        )
        db.add(product)
    await db.flush()

    for c_data in data.get("customers", []):
        customer = Customer(
            tenant_id=tenant_id,
            name=c_data["name"],
            phone=c_data.get("phone"),
            total_credit_cfa=c_data.get("total_credit_cfa", 0),
        )
        db.add(customer)

    for s_data in data.get("suppliers", []):
        supplier = Supplier(
            tenant_id=tenant_id,
            name=s_data["name"],
            phone=s_data.get("phone"),
        )
        db.add(supplier)

    for e_data in data.get("expenses", []):
        from datetime import datetime as dt
        expense = Expense(
            tenant_id=tenant_id,
            category=e_data.get("category", "Autre"),
            description=e_data.get("description", ""),
            amount_cfa=e_data.get("amount_cfa", 0),
            expense_date=dt.fromisoformat(e_data["expense_date"]) if e_data.get("expense_date") else dt.utcnow(),
        )
        db.add(expense)

    await db.flush()
    return {"status": "restored", "products": len(data.get("products", [])), "customers": len(data.get("customers", []))}


@router.delete("/data")
async def delete_all_data(user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    tenant_id = user.tenant_id

    customer_ids = [c.id for c in (await db.execute(select(Customer.id).where(Customer.tenant_id == tenant_id))).scalars().all()]
    tab_ids = [t.id for t in (await db.execute(select(CreditTab.id).where(CreditTab.customer_id.in_(customer_ids)))).scalars().all()] if customer_ids else []
    sale_ids = [s.id for s in (await db.execute(select(Sale.id).where(Sale.tenant_id == tenant_id))).scalars().all()]
    order_ids = [o.id for o in (await db.execute(select(Order.id).where(Order.tenant_id == tenant_id))).scalars().all()]
    product_ids = [p.id for p in (await db.execute(select(Product.id).where(Product.tenant_id == tenant_id))).scalars().all()]
    po_ids = [po.id for po in (await db.execute(select(PurchaseOrder.id).where(PurchaseOrder.tenant_id == tenant_id))).scalars().all()]

    if tab_ids:
        await db.execute(text(f"DELETE FROM credit_tab_entries WHERE tab_id IN ({','.join(repr(t) for t in tab_ids)})"))
        await db.execute(text(f"DELETE FROM credit_tabs WHERE id IN ({','.join(repr(t) for t in tab_ids)})"))
    if sale_ids:
        await db.execute(text(f"DELETE FROM sale_items WHERE sale_id IN ({','.join(repr(s) for s in sale_ids)})"))
        await db.execute(text(f"DELETE FROM sales WHERE id IN ({','.join(repr(s) for s in sale_ids)})"))
    if order_ids:
        await db.execute(text(f"DELETE FROM order_items WHERE order_id IN ({','.join(repr(o) for o in order_ids)})"))
        await db.execute(text(f"DELETE FROM orders WHERE id IN ({','.join(repr(o) for o in order_ids)})"))
    if product_ids:
        await db.execute(text(f"DELETE FROM product_images WHERE product_id IN ({','.join(repr(p) for p in product_ids)})"))
        await db.execute(text(f"DELETE FROM products WHERE id IN ({','.join(repr(p) for p in product_ids)})"))
    if po_ids:
        await db.execute(text(f"DELETE FROM purchase_order_items WHERE purchase_order_id IN ({','.join(repr(po) for po in po_ids)})"))
        await db.execute(text(f"DELETE FROM purchase_orders WHERE id IN ({','.join(repr(po) for po in po_ids)})"))

    await db.execute(text(f"DELETE FROM product_categories WHERE tenant_id = '{tenant_id}'"))
    await db.execute(text(f"DELETE FROM customers WHERE tenant_id = '{tenant_id}'"))
    await db.execute(text(f"DELETE FROM suppliers WHERE tenant_id = '{tenant_id}'"))
    await db.execute(text(f"DELETE FROM expenses WHERE tenant_id = '{tenant_id}'"))

    await db.flush()
    return {"status": "deleted", "message": "Toutes les données ont été supprimées"}
