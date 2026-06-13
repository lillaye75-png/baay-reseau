from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.tenant import Tenant
from app.models.product import Product, ProductCategory
from app.models.product_image import ProductImage
from app.models.review import ProductReview
from app.models.order import Order, OrderItem, StorefrontSettings

router = APIRouter()


@router.get("/store/{slug}")
async def get_store(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tenant).where(Tenant.slug == slug, Tenant.is_active == True))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")

    settings_result = await db.execute(
        select(StorefrontSettings).where(StorefrontSettings.tenant_id == tenant.id)
    )
    settings = settings_result.scalar_one_or_none()
    if not settings or not settings.is_enabled:
        raise HTTPException(status_code=404, detail="Online store is not enabled")

    return {
        "tenant_id": tenant.id,
        "store_name": settings.store_name or tenant.name,
        "store_description": settings.store_description,
        "banner_url": settings.banner_url,
        "theme_color": settings.theme_color,
        "delivery_fee_cfa": settings.delivery_fee_cfa,
        "min_order_cfa": settings.min_order_cfa,
        "accepts_wave": settings.accepts_wave,
        "accepts_orange_money": settings.accepts_orange_money,
        "accepts_cash_on_delivery": settings.accepts_cash_on_delivery,
        "phone": settings.phone or tenant.phone,
        "whatsapp": settings.whatsapp,
    }


@router.get("/store/{slug}/products")
async def get_store_products(slug: str, category: str = None, search: str = None, db: AsyncSession = Depends(get_db)):
    tenant_result = await db.execute(select(Tenant).where(Tenant.slug == slug, Tenant.is_active == True))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")

    query = (
        select(Product)
        .where(
            Product.tenant_id == tenant.id,
            Product.is_active == True,
            Product.is_online == True,
            Product.stock_quantity > 0,
        )
    )

    if category:
        cat_result = await db.execute(
            select(ProductCategory).where(ProductCategory.tenant_id == tenant.id, ProductCategory.name == category)
        )
        cat = cat_result.scalar_one_or_none()
        if cat:
            query = query.where(Product.category_id == cat.id)

    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))

    result = await db.execute(query.order_by(Product.name))
    products = result.scalars().all()

    items = []
    for p in products:
        cat_name = None
        if p.category_id:
            cat_result = await db.execute(select(ProductCategory).where(ProductCategory.id == p.category_id, ProductCategory.tenant_id == tenant.id))
            cat = cat_result.scalar_one_or_none()
            cat_name = cat.name if cat else None
        images_result = await db.execute(
            select(ProductImage).where(ProductImage.product_id == p.id).order_by(ProductImage.sort_order)
        )
        images = [{"id": i.id, "url": i.url, "alt_text": i.alt_text, "is_primary": i.is_primary} for i in images_result.scalars().all()]
        items.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "description": p.description,
            "price_cfa": p.price_cfa,
            "stock_quantity": p.stock_quantity,
            "unit": p.unit,
            "image_url": p.image_url,
            "images": images,
            "category_name": cat_name,
        })
    return items


@router.get("/store/{slug}/product/{product_id}")
async def get_store_product(slug: str, product_id: str, db: AsyncSession = Depends(get_db)):
    tenant_result = await db.execute(select(Tenant).where(Tenant.slug == slug, Tenant.is_active == True))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")

    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.tenant_id == tenant.id,
            Product.is_active == True,
            Product.is_online == True,
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    cat_name = None
    if product.category_id:
        cat_result = await db.execute(select(ProductCategory).where(ProductCategory.id == product.category_id, ProductCategory.tenant_id == tenant.id))
        cat = cat_result.scalar_one_or_none()
        cat_name = cat.name if cat else None

    images_result = await db.execute(
        select(ProductImage).where(ProductImage.product_id == product.id).order_by(ProductImage.sort_order)
    )
    images = [{"id": i.id, "url": i.url, "alt_text": i.alt_text, "is_primary": i.is_primary} for i in images_result.scalars().all()]

    return {
        "id": product.id,
        "name": product.name,
        "sku": product.sku,
        "description": product.description,
        "price_cfa": product.price_cfa,
        "stock_quantity": product.stock_quantity,
        "unit": product.unit,
        "image_url": product.image_url,
        "images": images,
        "category_name": cat_name,
    }


@router.get("/store/{slug}/categories")
async def get_store_categories(slug: str, db: AsyncSession = Depends(get_db)):
    tenant_result = await db.execute(select(Tenant).where(Tenant.slug == slug, Tenant.is_active == True))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")

    result = await db.execute(
        select(ProductCategory).where(ProductCategory.tenant_id == tenant.id)
    )
    return [{"id": c.id, "name": c.name, "name_wo": c.name_wo} for c in result.scalars().all()]


@router.post("/store/{slug}/order")
async def create_store_order(slug: str, data: dict, db: AsyncSession = Depends(get_db)):
    tenant_result = await db.execute(select(Tenant).where(Tenant.slug == slug, Tenant.is_active == True))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")

    settings_result = await db.execute(
        select(StorefrontSettings).where(StorefrontSettings.tenant_id == tenant.id)
    )
    settings = settings_result.scalar_one_or_none()
    if not settings or not settings.is_enabled:
        raise HTTPException(status_code=400, detail="Online store is not enabled")

    items_data = data.get("items", [])
    if not items_data:
        raise HTTPException(status_code=400, detail="No items in order")

    total = 0
    order_items = []
    for item_data in items_data:
        product_result = await db.execute(
            select(Product).where(
                Product.id == item_data["product_id"],
                Product.tenant_id == tenant.id,
                Product.is_active == True,
                Product.is_online == True,
            )
        )
        product = product_result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item_data['product_id']} not found")
        if product.stock_quantity < item_data.get("quantity", 1):
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

        qty = item_data.get("quantity", 1)
        item_total = product.price_cfa * qty
        total += item_total

        order_items.append({
            "product_id": product.id,
            "product_name": product.name,
            "quantity": qty,
            "unit_price_cfa": product.price_cfa,
            "total_cfa": item_total,
        })
        product.stock_quantity -= qty

    total += settings.delivery_fee_cfa

    if settings.min_order_cfa > 0 and total < settings.min_order_cfa:
        raise HTTPException(status_code=400, detail=f"Minimum order is {settings.min_order_cfa} CFA")

    order = Order(
        tenant_id=tenant.id,
        customer_name=data.get("customer_name", ""),
        customer_phone=data.get("customer_phone", ""),
        customer_email=data.get("customer_email"),
        customer_address=data.get("customer_address", ""),
        customer_notes=data.get("customer_notes"),
        total_cfa=total,
        payment_method=data.get("payment_method", "wave"),
        delivery_method=data.get("delivery_method", "delivery"),
        status="pending",
    )
    db.add(order)
    await db.flush()

    for item in order_items:
        db.add(OrderItem(order_id=order.id, **item))

    await db.flush()

    try:
        from app.integrations.whatsapp import send_whatsapp_message
        from app.core.logging import logger
        notif_msg = (
            f"Nouvelle commande !\n"
            f"Client: {data.get('customer_name', '')}\n"
            f"Tél: {data.get('customer_phone', '')}\n"
            f"Adresse: {data.get('customer_address', '')}\n"
            f"Total: {total:,} CFA\n"
            f"Articles: {len(order_items)}\n"
            f"Commande #{order.id[:8].upper()}"
        )
        tenant_phone = tenant.phone
        if settings.WHATSAPP_API_TOKEN and settings.WHATSAPP_API_TOKEN != "dummy":
            await send_whatsapp_message(tenant_phone, notif_msg)
        logger.info(f"Order notification sent for {order.id[:8]}")
    except Exception:
        pass

    return {
        "order_id": order.id,
        "total_cfa": total,
        "status": "pending",
        "message": "Commande enregistrée ! Vous serez contacté(e) pour la livraison.",
    }


@router.get("/store/{slug}/order/{order_id}")
async def get_store_order(slug: str, order_id: str, db: AsyncSession = Depends(get_db)):
    tenant_result = await db.execute(select(Tenant).where(Tenant.slug == slug, Tenant.is_active == True))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")

    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.tenant_id == tenant.id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "id": order.id,
        "customer_name": order.customer_name,
        "total_cfa": order.total_cfa,
        "status": order.status,
        "payment_method": order.payment_method,
        "delivery_method": order.delivery_method,
        "created_at": order.created_at,
        "items": [{"product_name": i.product_name, "quantity": i.quantity, "unit_price_cfa": i.unit_price_cfa, "total_cfa": i.total_cfa} for i in order.items],
    }


@router.get("/store/{slug}/product/{product_id}/reviews")
async def get_product_reviews(slug: str, product_id: str, db: AsyncSession = Depends(get_db)):
    tenant_result = await db.execute(select(Tenant).where(Tenant.slug == slug, Tenant.is_active == True))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")

    result = await db.execute(
        select(ProductReview)
        .where(ProductReview.product_id == product_id, ProductReview.tenant_id == tenant.id, ProductReview.is_approved == True)
        .order_by(ProductReview.created_at.desc())
    )
    reviews = result.scalars().all()

    avg_result = await db.execute(
        select(func.avg(ProductReview.rating), func.count(ProductReview.id))
        .where(ProductReview.product_id == product_id, ProductReview.tenant_id == tenant.id, ProductReview.is_approved == True)
    )
    avg_row = avg_result.one()

    return {
        "reviews": [{"id": r.id, "customer_name": r.customer_name, "rating": r.rating, "comment": r.comment, "created_at": r.created_at} for r in reviews],
        "average_rating": round(float(avg_row[0] or 0), 1),
        "total_reviews": avg_row[1],
    }


@router.post("/store/{slug}/product/{product_id}/reviews")
async def create_product_review(slug: str, product_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    tenant_result = await db.execute(select(Tenant).where(Tenant.slug == slug, Tenant.is_active == True))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Store not found")

    product_result = await db.execute(
        select(Product).where(Product.id == product_id, Product.tenant_id == tenant.id, Product.is_active == True)
    )
    if not product_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")

    rating = data.get("rating", 5)
    if not 1 <= rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")

    review = ProductReview(
        product_id=product_id,
        tenant_id=tenant.id,
        customer_name=data.get("customer_name", "Anonyme"),
        rating=rating,
        comment=data.get("comment"),
    )
    db.add(review)
    await db.flush()
    return {"status": "submitted", "message": "Votre avis sera visible après approbation."}
