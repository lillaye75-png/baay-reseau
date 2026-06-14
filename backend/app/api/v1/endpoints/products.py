from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.product import Product, ProductCategory
from app.models.product_image import ProductImage
from app.schemas.product import ProductCreate, ProductRead, ProductCategoryCreate, ProductCategoryRead

router = APIRouter()


@router.get("/", response_model=list[ProductRead])
async def list_products(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(Product.tenant_id == user.tenant_id, Product.is_active == True)
    )
    return list(result.scalars().all())


@router.post("/", response_model=ProductRead, status_code=201)
async def create_product(data: ProductCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(Product).where(Product.tenant_id == user.tenant_id, Product.name == data.name, Product.is_active == True)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Un produit avec ce nom existe déjà")
    product = Product(tenant_id=user.tenant_id, **data.model_dump())
    db.add(product)
    await db.flush()
    return product


@router.get("/categories/", response_model=list[ProductCategoryRead])
async def list_categories(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProductCategory).where(ProductCategory.tenant_id == user.tenant_id))
    return list(result.scalars().all())


@router.post("/categories/", response_model=ProductCategoryRead, status_code=201)
async def create_category(data: ProductCategoryCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    category = ProductCategory(tenant_id=user.tenant_id, **data.model_dump())
    db.add(category)
    await db.flush()
    return category


@router.put("/categories/{category_id}", response_model=ProductCategoryRead)
async def update_category(category_id: str, data: ProductCategoryCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProductCategory).where(ProductCategory.id == category_id, ProductCategory.tenant_id == user.tenant_id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in data.model_dump().items():
        setattr(category, field, value)
    await db.flush()
    return category


@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProductCategory).where(ProductCategory.id == category_id, ProductCategory.tenant_id == user.tenant_id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(category)
    await db.flush()
    return {"status": "deleted"}


@router.get("/barcode/{barcode}")
async def get_product_by_barcode(barcode: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(
            Product.barcode == barcode,
            Product.tenant_id == user.tenant_id,
            Product.is_active == True,
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(product_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.tenant_id == user.tenant_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductRead)
async def update_product(product_id: str, data: ProductCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.tenant_id == user.tenant_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in data.model_dump().items():
        setattr(product, field, value)
    await db.flush()
    return product


@router.delete("/{product_id}")
async def delete_product(product_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.tenant_id == user.tenant_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    await db.flush()
    return {"status": "deleted"}


@router.post("/{product_id}/image")
async def upload_product_image(product_id: str, file: UploadFile = File(...), user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.tenant_id == user.tenant_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    content = await file.read()
    
    from app.services.cloud_storage import upload_image
    upload_result = await upload_image(
        content,
        folder=f"baay-reseau/{user.tenant_id}/products",
        public_id=f"{product_id}_{uuid.uuid4().hex[:8]}",
    )

    img_count_result = await db.execute(select(ProductImage).where(ProductImage.product_id == product_id))
    img_count = len(img_count_result.scalars().all())

    image = ProductImage(
        product_id=product_id,
        url=upload_result["url"],
        alt_text=product.name,
        sort_order=img_count,
        is_primary=img_count == 0,
    )
    db.add(image)

    if img_count == 0:
        product.image_url = upload_result["url"]

    await db.flush()
    return {"image_url": image.url, "id": image.id, "is_primary": image.is_primary}


@router.get("/{product_id}/images")
async def get_product_images(product_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProductImage).where(ProductImage.product_id == product_id).order_by(ProductImage.sort_order)
    )
    images = result.scalars().all()
    return [{"id": i.id, "url": i.url, "alt_text": i.alt_text, "sort_order": i.sort_order, "is_primary": i.is_primary} for i in images]


@router.delete("/images/{image_id}")
async def delete_product_image(image_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProductImage).where(ProductImage.id == image_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    product_result = await db.execute(
        select(Product).where(Product.id == image.product_id, Product.tenant_id == user.tenant_id)
    )
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=403, detail="Not authorized")

    from app.services.cloud_storage import delete_image, get_public_id_from_url
    public_id = get_public_id_from_url(image.url)
    if public_id:
        await delete_image(public_id)

    was_primary = image.is_primary
    await db.delete(image)

    if was_primary:
        remaining = await db.execute(
            select(ProductImage).where(ProductImage.product_id == image.product_id).order_by(ProductImage.sort_order)
        )
        first = remaining.scalars().first()
        if first:
            first.is_primary = True
            product.image_url = first.url
        else:
            product.image_url = None

    await db.flush()
    return {"status": "deleted"}
