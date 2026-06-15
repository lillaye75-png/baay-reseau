from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select, delete as sa_del
from sqlalchemy.ext.asyncio import AsyncSession

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
        "products": [{"name": p.name, "sku": p.sku, "description": p.description, "price_cfa": p.price_cfa, "cost_price_cfa": p.cost_price_cfa, "stock_quantity": p.stock_quantity, "low_stock_threshold": p.low_stock_threshold, "unit": p.unit, "barcode": p.barcode, "is_online": p.is_online} for p in products],
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
        db.add(ProductCategory(tenant_id=tenant_id, name=cat_data["name"], name_wo=cat_data.get("name_wo")))
    await db.flush()

    cat_map = {}
    for c in (await db.execute(select(ProductCategory).where(ProductCategory.tenant_id == tenant_id))).scalars().all():
        cat_map[c.name] = c.id

    for p_data in data.get("products", []):
        db.add(Product(
            tenant_id=tenant_id, name=p_data["name"], sku=p_data.get("sku"), description=p_data.get("description"),
            price_cfa=p_data.get("price_cfa", 0), cost_price_cfa=p_data.get("cost_price_cfa", 0),
            stock_quantity=p_data.get("stock_quantity", 0), low_stock_threshold=p_data.get("low_stock_threshold", 5),
            unit=p_data.get("unit", "piece"), barcode=p_data.get("barcode"), is_online=p_data.get("is_online", True),
        ))
    for c_data in data.get("customers", []):
        db.add(Customer(tenant_id=tenant_id, name=c_data["name"], phone=c_data.get("phone"), total_credit_cfa=c_data.get("total_credit_cfa", 0)))
    for s_data in data.get("suppliers", []):
        db.add(Supplier(tenant_id=tenant_id, name=s_data["name"], phone=s_data.get("phone")))
    for e_data in data.get("expenses", []):
        from datetime import datetime as dt
        db.add(Expense(tenant_id=tenant_id, category=e_data.get("category", "Autre"), description=e_data.get("description", ""),
                       amount_cfa=e_data.get("amount_cfa", 0),
                       expense_date=dt.fromisoformat(e_data["expense_date"]) if e_data.get("expense_date") else dt.utcnow()))

    await db.flush()
    return {"status": "restored", "products": len(data.get("products", [])), "customers": len(data.get("customers", []))}


@router.delete("/data")
async def delete_all_data(user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    tid = user.tenant_id

    try:
        from app.models.product import ProductVariant, ProductVariantOption
        from app.models.review import ProductReview

        customer_ids = [c.id for c in (await db.execute(select(Customer.id).where(Customer.tenant_id == tid))).scalars().all()]
        sale_ids = [s.id for s in (await db.execute(select(Sale.id).where(Sale.tenant_id == tid))).scalars().all()]
        order_ids = [o.id for o in (await db.execute(select(Order.id).where(Order.tenant_id == tid))).scalars().all()]
        product_ids = [p.id for p in (await db.execute(select(Product.id).where(Product.tenant_id == tid))).scalars().all()]
        po_ids = [p.id for p in (await db.execute(select(PurchaseOrder.id).where(PurchaseOrder.tenant_id == tid))).scalars().all()]

        if customer_ids:
            tab_ids = [t.id for t in (await db.execute(select(CreditTab.id).where(CreditTab.customer_id.in_(customer_ids)))).scalars().all()]
            if tab_ids:
                await db.execute(sa_del(CreditTabEntry).where(CreditTabEntry.tab_id.in_(tab_ids)))
                await db.execute(sa_del(CreditTab).where(CreditTab.id.in_(tab_ids)))
            await db.execute(sa_del(Customer).where(Customer.id.in_(customer_ids)))

        if sale_ids:
            await db.execute(sa_del(SaleItem).where(SaleItem.sale_id.in_(sale_ids)))
            await db.execute(sa_del(Sale).where(Sale.id.in_(sale_ids)))

        if order_ids:
            await db.execute(sa_del(OrderItem).where(OrderItem.order_id.in_(order_ids)))
            await db.execute(sa_del(Order).where(Order.id.in_(order_ids)))

        if product_ids:
            await db.execute(sa_del(ProductImage).where(ProductImage.product_id.in_(product_ids)))
            try:
                await db.execute(sa_del(ProductReview).where(ProductReview.product_id.in_(product_ids)))
            except Exception:
                pass
            try:
                await db.execute(sa_del(ProductVariantOption).where(ProductVariantOption.product_id.in_(product_ids)))
                await db.execute(sa_del(ProductVariant).where(ProductVariant.product_id.in_(product_ids)))
            except Exception:
                pass
            await db.execute(sa_del(Product).where(Product.id.in_(product_ids)))

        if po_ids:
            await db.execute(sa_del(PurchaseOrderItem).where(PurchaseOrderItem.purchase_order_id.in_(po_ids)))
            await db.execute(sa_del(PurchaseOrder).where(PurchaseOrder.id.in_(po_ids)))

        await db.execute(sa_del(ProductCategory).where(ProductCategory.tenant_id == tid))
        await db.execute(sa_del(Supplier).where(Supplier.tenant_id == tid))
        await db.execute(sa_del(Expense).where(Expense.tenant_id == tid))

        await db.flush()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "deleted", "message": "Toutes les données ont été supprimées"}
