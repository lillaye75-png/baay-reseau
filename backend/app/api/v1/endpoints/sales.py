from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import csv
import io

from app.core.database import get_db
from app.api.deps import get_current_user, require_owner
from app.models.user import User
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.schemas.sale import SaleCreate, SaleRead, QuickSaleCreate
from app.services.sales import create_sale, get_sales, get_daily_revenue, get_weekly_revenue, create_quick_sale
from app.integrations.payments import create_wave_checkout, create_orange_money_link, get_qr_svg
from app.services.audit import log_action

router = APIRouter()


@router.get("/", response_model=list[SaleRead])
async def list_sales(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    sales = await get_sales(db, user.tenant_id)
    result = []
    for s in sales:
        store_name = None
        employee_name = None
        if hasattr(s, 'store') and s.store:
            store_name = s.store.name
        if hasattr(s, 'user') and s.user:
            employee_name = s.user.name
        sale_dict = {
            "id": s.id,
            "tenant_id": s.tenant_id,
            "store_id": s.store_id if hasattr(s, 'store_id') else None,
            "user_id": s.user_id if hasattr(s, 'user_id') else None,
            "store_name": store_name,
            "employee_name": employee_name,
            "customer_id": s.customer_id,
            "customer": s.customer,
            "total_cfa": s.total_cfa,
            "payment_method": s.payment_method,
            "payment_reference": s.payment_reference,
            "is_credit": s.is_credit,
            "created_at": s.created_at,
            "items": s.items,
        }
        result.append(SaleRead.model_validate(sale_dict))
    return result


@router.get("/stats/weekly")
async def weekly_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_weekly_revenue(db, user.tenant_id)


@router.get("/export-csv")
async def export_sales_csv(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    sales = await get_sales(db, user.tenant_id, limit=10000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Total (CFA)", "Paiement", "Crédit", "Articles"])
    for s in sales:
        writer.writerow([str(s.created_at), s.total_cfa, s.payment_method, "Oui" if s.is_credit else "Non", len(s.items)])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename=ventes-{__import__('datetime').date.today()}.csv"},
    )


@router.get("/{sale_id}", response_model=SaleRead)
async def get_sale(sale_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models.customer import Customer
    result = await db.execute(
        select(Sale).where(Sale.id == sale_id, Sale.tenant_id == user.tenant_id)
        .options(
            selectinload(Sale.items).selectinload(SaleItem.product),
            selectinload(Sale.customer),
        )
    )
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.post("/", response_model=SaleRead, status_code=201)
async def create_new_sale(data: SaleCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    sale = await create_sale(db, user.tenant_id, data, user_id=user.id)
    try:
        await log_action(db, user.tenant_id, user.id, user.name, "create", "sale", sale.id, f"Vente {sale.total_cfa} CFA ({sale.payment_method})")
    except Exception:
        pass
    store_name = None
    employee_name = user.name
    if hasattr(sale, 'store') and sale.store:
        store_name = sale.store.name
    sale_dict = {
        "id": sale.id,
        "tenant_id": sale.tenant_id,
        "store_id": sale.store_id if hasattr(sale, 'store_id') else None,
        "user_id": sale.user_id if hasattr(sale, 'user_id') else None,
        "store_name": store_name,
        "employee_name": employee_name,
        "customer_id": sale.customer_id,
        "customer": sale.customer,
        "total_cfa": sale.total_cfa,
        "payment_method": sale.payment_method,
        "payment_reference": sale.payment_reference,
        "is_credit": sale.is_credit,
        "created_at": sale.created_at,
        "items": sale.items,
    }
    return SaleRead.model_validate(sale_dict)


@router.post("/quick", response_model=SaleRead, status_code=201)
async def create_quick_sale_endpoint(data: QuickSaleCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    sale = await create_quick_sale(db, user.tenant_id, data)
    try:
        await log_action(db, user.tenant_id, user.id, user.name, "create", "quick_sale", sale.id, f"Vente rapide {data.product_name} {data.unit_price_cfa} CFA")
    except Exception:
        pass
    return sale


@router.post("/{product_id}/adjust-stock")
async def adjust_stock(product_id: str, data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.inventory import update_stock
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.tenant_id == user.tenant_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    adjustment = data.get("quantity", 0)
    updated = await update_stock(db, product_id, adjustment)
    return {"stock_quantity": updated.stock_quantity}


@router.post("/payment-link/wave")
async def generate_wave_link(data: dict, user: User = Depends(get_current_user)):
    amount = data.get("amount", 0)
    phone = data.get("phone", "")
    order_id = data.get("order_id", f"order-{user.id[:8]}")
    result = await create_wave_checkout(amount, phone, order_id)
    if "payment_url" in result:
        result["qr_url"] = get_qr_svg(result["payment_url"])
    return result


@router.post("/payment-link/orange-money")
async def generate_orange_money_link(data: dict, user: User = Depends(get_current_user)):
    amount = data.get("amount", 0)
    phone = data.get("phone", "")
    order_id = data.get("order_id", f"order-{user.id[:8]}")
    result = await create_orange_money_link(amount, phone, order_id)
    if "payment_url" in result:
        result["qr_url"] = get_qr_svg(result["payment_url"])
    return result


@router.put("/{sale_id}", response_model=SaleRead)
async def update_sale(sale_id: str, data: SaleCreate, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    from app.services.sales import update_sale as update_sale_svc
    try:
        return await update_sale_svc(db, user.tenant_id, sale_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{sale_id}")
async def delete_sale(sale_id: str, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    from app.services.sales import delete_sale as delete_sale_svc
    try:
        return await delete_sale_svc(db, user.tenant_id, sale_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sync")
async def sync_offline_sales(data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    queued_sales = data.get("sales", [])
    synced = []
    errors = []

    for sale_data in queued_sales:
        try:
            from app.schemas.sale import SaleCreate, SaleItemCreate
            items = [SaleItemCreate(**item) for item in sale_data.get("items", [])]
            sale_create = SaleCreate(
                customer_id=sale_data.get("customer_id"),
                items=items,
                payment_method=sale_data.get("payment_method", "cash"),
                is_credit=sale_data.get("is_credit", False),
                store_id=sale_data.get("store_id"),
            )
            sale = await create_sale(db, user.tenant_id, sale_create, user_id=user.id)
            synced.append({"local_id": sale_data.get("local_id"), "server_id": sale.id})
        except Exception as e:
            errors.append({"local_id": sale_data.get("local_id"), "error": str(e)})

    return {"synced": len(synced), "errors": len(errors), "details": synced, "error_details": errors}
