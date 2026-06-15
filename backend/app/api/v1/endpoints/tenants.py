from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user, require_owner
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.tenant import TenantRead, TenantUpdate, TenantIntegrations

router = APIRouter()


@router.get("/me", response_model=TenantRead)
async def get_my_tenant(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.put("/{tenant_id}", response_model=TenantRead)
async def update_tenant(tenant_id: str, data: TenantUpdate, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    if user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)
    await db.flush()
    return tenant


@router.put("/{tenant_id}/integrations")
async def update_integrations(tenant_id: str, data: TenantIntegrations, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    if user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)
    await db.flush()
    return {"status": "ok"}


@router.get("/backup")
async def backup_data(user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    from app.models.product import Product, ProductCategory
    from app.models.customer import Customer
    from app.models.sale import Sale, SaleItem
    from app.models.order import Order, OrderItem
    from app.models.supplier import Supplier, Expense
    from app.models.credit_tab import CreditTab
    import json

    tenant_id = user.tenant_id

    products = (await db.execute(select(Product).where(Product.tenant_id == tenant_id))).scalars().all()
    categories = (await db.execute(select(ProductCategory).where(ProductCategory.tenant_id == tenant_id))).scalars().all()
    customers = (await db.execute(select(Customer).where(Customer.tenant_id == tenant_id))).scalars().all()
    sales = (await db.execute(select(Sale).where(Sale.tenant_id == tenant_id))).scalars().all()
    orders = (await db.execute(select(Order).where(Order.tenant_id == tenant_id))).scalars().all()
    suppliers = (await db.execute(select(Supplier).where(Supplier.tenant_id == tenant_id))).scalars().all()
    expenses = (await db.execute(select(Expense).where(Expense.tenant_id == tenant_id))).scalars().all()

    data = {
        "exported_at": str(__import__("datetime").datetime.utcnow()),
        "products": [{"name": p.name, "sku": p.sku, "price_cfa": p.price_cfa, "cost_price_cfa": p.cost_price_cfa, "stock_quantity": p.stock_quantity, "unit": p.unit, "barcode": p.barcode} for p in products],
        "categories": [{"name": c.name, "name_wo": c.name_wo} for c in categories],
        "customers": [{"name": c.name, "phone": c.phone, "total_credit_cfa": c.total_credit_cfa} for c in customers],
        "sales_count": len(sales),
        "orders_count": len(orders),
        "suppliers": [{"name": s.name, "phone": s.phone} for s in suppliers],
        "expenses": [{"category": e.category, "description": e.description, "amount_cfa": e.amount_cfa} for e in expenses],
    }

    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f"attachment; filename=baay-backup-{__import__('datetime').date.today()}.json"},
    )


@router.delete("/data")
async def delete_all_data(user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    from app.models.product import Product, ProductCategory
    from app.models.product_image import ProductImage
    from app.models.customer import Customer
    from app.models.sale import Sale, SaleItem
    from app.models.order import Order, OrderItem
    from app.models.supplier import Supplier, PurchaseOrder, PurchaseOrderItem, Expense
    from app.models.credit_tab import CreditTab, CreditTabEntry
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
