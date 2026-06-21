from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user, require_owner, check_limit
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.tenant import TenantRead, TenantUpdate, TenantIntegrations, PrintSettings

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


@router.get("/{tenant_id}/print-settings")
async def get_print_settings(tenant_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return {
        "print_logo_url": tenant.print_logo_url,
        "print_header_text": tenant.print_header_text,
        "print_footer_text": tenant.print_footer_text,
        "print_show_barcode": tenant.print_show_barcode,
        "print_show_qr": tenant.print_show_qr,
    }


@router.put("/{tenant_id}/print-settings")
async def update_print_settings(tenant_id: str, data: PrintSettings, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
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


@router.get("/stores")
async def list_my_stores(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    try:
        result = await db.execute(
            text("SELECT t.id, t.name, t.slug, t.is_active, us.is_default FROM tenants t JOIN user_stores us ON t.id = us.tenant_id WHERE us.user_id = :user_id"),
            {"user_id": user.id}
        )
        stores = [{"id": row[0], "name": row[1], "slug": row[2], "is_active": row[3], "is_default": row[4]} for row in result.all()]
    except Exception:
        stores = []

    if not stores:
        stores = [{"id": user.tenant_id, "name": "Ma Boutique", "slug": "", "is_active": True, "is_default": True}]

    return stores


@router.post("/stores")
async def create_new_store(data: dict, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    from app.core.logging import logger
    import uuid

    logger.info(f"POST /stores by user={user.id} data={data}")

    try:
        name = str(data.get("name", "Nouvelle boutique"))[:255]
        slug = str(data.get("slug", f"store-{str(uuid.uuid4())[:8]}"))[:100]
        phone = str(data.get("phone") or user.phone or "")[:255]
        email_val = data.get("email")
        if email_val and str(email_val).strip():
            email_val = str(email_val).strip()[:255]
        else:
            email_val = None

        store = Tenant(name=name, slug=slug, phone=phone, email=email_val)
        db.add(store)
        await db.flush()
        logger.info(f"Store created: {store.id}")

        assigned_user_id = data.get("assigned_user_id")
        if assigned_user_id and str(assigned_user_id).strip():
            assigned_user_id = str(assigned_user_id).strip()
        else:
            assigned_user_id = None

        try:
            await db.execute(
                text("INSERT INTO user_stores (id, user_id, tenant_id, is_default) VALUES (:id, :user_id, :tenant_id, :is_default)"),
                {"id": str(uuid.uuid4()), "user_id": user.id, "tenant_id": store.id, "is_default": False}
            )
            logger.info("Owner added to user_stores")
        except Exception as e:
            logger.warning(f"user_stores owner insert failed: {e}")

        if assigned_user_id:
            try:
                existing = await db.execute(
                    text("SELECT id FROM user_stores WHERE user_id = :uid AND tenant_id = :tid"),
                    {"uid": assigned_user_id, "tid": store.id}
                )
                if not existing.first():
                    await db.execute(
                        text("INSERT INTO user_stores (id, user_id, tenant_id, is_default) VALUES (:id, :user_id, :tenant_id, 0)"),
                        {"id": str(uuid.uuid4()), "user_id": assigned_user_id, "tenant_id": store.id}
                    )
                    logger.info(f"Employee {assigned_user_id} assigned to store")
                else:
                    logger.info("Employee already in user_stores")
            except Exception as e:
                logger.warning(f"user_stores assign failed: {e}")

        await db.flush()
        logger.info(f"Store creation OK: {store.id}")

        return {"id": store.id, "name": store.name, "slug": store.slug, "assigned_user_id": assigned_user_id}
    except Exception as e:
        logger.error(f"Store creation FAILED: {type(e).__name__}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Erreur création boutique: {str(e)}")


@router.put("/stores/{store_id}/switch")
async def switch_store(store_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text

    result = await db.execute(
        text("SELECT tenant_id FROM user_stores WHERE user_id = :user_id AND tenant_id = :store_id"),
        {"user_id": user.id, "store_id": store_id}
    )
    if not result.first():
        raise HTTPException(status_code=403, detail="Store not accessible")

    await db.execute(
        text("UPDATE user_stores SET is_default = FALSE WHERE user_id = :user_id"),
        {"user_id": user.id}
    )
    await db.execute(
        text("UPDATE user_stores SET is_default = TRUE WHERE user_id = :user_id AND tenant_id = :store_id"),
        {"user_id": user.id, "store_id": store_id}
    )
    await db.flush()

    return {"status": "switched", "tenant_id": store_id}


@router.put("/stores/{store_id}/suspend")
async def suspend_store(store_id: str, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text

    is_owner = await db.execute(
        text("SELECT id FROM user_stores WHERE user_id = :uid AND tenant_id = :tid"),
        {"uid": user.id, "tid": store_id}
    )
    if not is_owner.first():
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(select(Tenant).where(Tenant.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    store.is_active = not store.is_active
    await db.flush()

    return {"status": "suspended" if not store.is_active else "activated", "is_active": store.is_active}


@router.delete("/stores/{store_id}")
async def delete_store(store_id: str, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text

    is_owner = await db.execute(
        text("SELECT id FROM user_stores WHERE user_id = :uid AND tenant_id = :tid"),
        {"uid": user.id, "tid": store_id}
    )
    if not is_owner.first():
        raise HTTPException(status_code=403, detail="Not authorized")

    is_default = await db.execute(
        text("SELECT is_default FROM user_stores WHERE user_id = :uid AND tenant_id = :tid"),
        {"uid": user.id, "tid": store_id}
    )
    row = is_default.first()
    if row and row[0]:
        raise HTTPException(status_code=400, detail="Cannot delete your active store. Switch to another store first.")

    await db.execute(text("DELETE FROM user_stores WHERE tenant_id = :tid"), {"tid": store_id})

    result = await db.execute(select(Tenant).where(Tenant.id == store_id))
    store = result.scalar_one_or_none()
    if store:
        store.is_active = False
        await db.flush()

    return {"status": "deleted"}
