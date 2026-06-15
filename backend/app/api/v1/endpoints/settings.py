from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select
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
    sale_items = (await db.execute(select(SaleItem).join(Sale, SaleItem.sale_id == Sale.id).where(Sale.tenant_id == tenant_id))).scalars().all()
    orders = (await db.execute(select(Order).where(Order.tenant_id == tenant_id))).scalars().all()
    suppliers = (await db.execute(select(Supplier).where(Supplier.tenant_id == tenant_id))).scalars().all()
    expenses = (await db.execute(select(Expense).where(Expense.tenant_id == tenant_id))).scalars().all()

    from datetime import datetime, date
    data = {
        "exported_at": str(datetime.utcnow()),
        "tenant": {"name": user.tenant.name, "slug": user.tenant.slug, "phone": user.tenant.phone, "email": user.tenant.email},
        "products": [{"name": p.name, "sku": p.sku, "description": p.description, "price_cfa": p.price_cfa, "cost_price_cfa": p.cost_price_cfa, "stock_quantity": p.stock_quantity, "low_stock_threshold": p.low_stock_threshold, "unit": p.unit, "barcode": p.barcode, "is_online": p.is_online} for p in products],
        "categories": [{"name": c.name, "name_wo": c.name_wo} for c in categories],
        "customers": [{"name": c.name, "phone": c.phone, "email": getattr(c, 'email', None), "total_credit_cfa": c.total_credit_cfa, "notes": getattr(c, 'notes', None)} for c in customers],
        "sales": [{"total_cfa": s.total_cfa, "payment_method": s.payment_method, "is_credit": s.is_credit, "created_at": str(s.created_at), "items": [{"product_name": si.product_name, "quantity": si.quantity, "unit_price_cfa": si.unit_price_cfa, "total_cfa": si.total_cfa} for si in sale_items if si.sale_id == s.id]} for s in sales],
        "suppliers": [{"name": s.name, "phone": s.phone, "email": getattr(s, 'email', None), "address": getattr(s, 'address', None)} for s in suppliers],
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
            notes=c_data.get("notes"),
        )
        db.add(customer)

    for s_data in data.get("suppliers", []):
        supplier = Supplier(
            tenant_id=tenant_id,
            name=s_data["name"],
            phone=s_data.get("phone"),
            email=s_data.get("email"),
            address=s_data.get("address"),
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
    from sqlalchemy import delete as sa_del

    tenant_id = user.tenant_id

    await db.execute(sa_del(CreditTabEntry).where(CreditTabEntry.tab_id.in_(
        select(CreditTab.id).where(CreditTab.tenant_id == tenant_id)
    )))
    await db.execute(sa_del(CreditTab).where(CreditTab.tenant_id == tenant_id))
    await db.execute(sa_del(SaleItem).where(SaleItem.sale_id.in_(
        select(Sale.id).where(Sale.tenant_id == tenant_id)
    )))
    await db.execute(sa_del(Sale).where(Sale.tenant_id == tenant_id))
    await db.execute(sa_del(OrderItem).where(OrderItem.order_id.in_(
        select(Order.id).where(Order.tenant_id == tenant_id)
    )))
    await db.execute(sa_del(Order).where(Order.tenant_id == tenant_id))
    await db.execute(sa_del(ProductImage).where(ProductImage.product_id.in_(
        select(Product.id).where(Product.tenant_id == tenant_id)
    )))
    await db.execute(sa_del(Product).where(Product.tenant_id == tenant_id))
    await db.execute(sa_del(ProductCategory).where(ProductCategory.tenant_id == tenant_id))
    await db.execute(sa_del(Customer).where(Customer.tenant_id == tenant_id))
    await db.execute(sa_del(PurchaseOrderItem).where(PurchaseOrderItem.purchase_order_id.in_(
        select(PurchaseOrder.id).where(PurchaseOrder.tenant_id == tenant_id)
    )))
    await db.execute(sa_del(PurchaseOrder).where(PurchaseOrder.tenant_id == tenant_id))
    await db.execute(sa_del(Supplier).where(Supplier.tenant_id == tenant_id))
    await db.execute(sa_del(Expense).where(Expense.tenant_id == tenant_id))

    await db.flush()
    return {"status": "deleted", "message": "Toutes les données ont été supprimées"}
