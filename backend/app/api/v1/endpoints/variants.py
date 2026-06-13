from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.product_variant import ProductVariant, ProductVariantOption
from app.schemas.product import (
    ProductVariantCreate,
    ProductVariantUpdate,
    ProductVariantRead,
    ProductVariantOptionCreate,
    ProductVariantOptionRead,
)

router = APIRouter()


@router.get("/{product_id}/variants", response_model=list[ProductVariantRead])
async def get_product_variants(
    product_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProductVariant).where(
            ProductVariant.product_id == product_id,
            ProductVariant.tenant_id == user.tenant_id,
            ProductVariant.is_active == True,
        )
    )
    return result.scalars().all()


@router.post("/{product_id}/variants", response_model=ProductVariantRead)
async def create_product_variant(
    product_id: str,
    data: ProductVariantCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    product_result = await db.execute(
        select(Product).where(Product.id == product_id, Product.tenant_id == user.tenant_id)
    )
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    variant = ProductVariant(
        product_id=product_id,
        tenant_id=user.tenant_id,
        name=data.name,
        sku=data.sku,
        barcode=data.barcode,
        color=data.color,
        size=data.size,
        price_cfa=data.price_cfa,
        cost_price_cfa=data.cost_price_cfa,
        stock_quantity=data.stock_quantity,
        low_stock_threshold=data.low_stock_threshold,
    )
    db.add(variant)
    await db.flush()
    return variant


@router.put("/{product_id}/variants/{variant_id}", response_model=ProductVariantRead)
async def update_product_variant(
    product_id: str,
    variant_id: str,
    data: ProductVariantUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProductVariant).where(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product_id,
            ProductVariant.tenant_id == user.tenant_id,
        )
    )
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(variant, key, value)

    await db.flush()
    return variant


@router.delete("/{product_id}/variants/{variant_id}")
async def delete_product_variant(
    product_id: str,
    variant_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProductVariant).where(
            ProductVariant.id == variant_id,
            ProductVariant.product_id == product_id,
            ProductVariant.tenant_id == user.tenant_id,
        )
    )
    variant = result.scalar_one_or_none()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    variant.is_active = False
    await db.flush()
    return {"status": "deleted"}


@router.get("/{product_id}/options", response_model=list[ProductVariantOptionRead])
async def get_product_options(
    product_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProductVariantOption).where(
            ProductVariantOption.product_id == product_id,
            ProductVariantOption.tenant_id == user.tenant_id,
        ).order_by(ProductVariantOption.sort_order)
    )
    return result.scalars().all()


@router.post("/{product_id}/options", response_model=ProductVariantOptionRead)
async def create_product_option(
    product_id: str,
    data: ProductVariantOptionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    option = ProductVariantOption(
        product_id=product_id,
        tenant_id=user.tenant_id,
        option_type=data.option_type,
        option_value=data.option_value,
        display_name=data.display_name,
        hex_color=data.hex_color,
        sort_order=data.sort_order,
    )
    db.add(option)
    await db.flush()
    return option


@router.delete("/{product_id}/options/{option_id}")
async def delete_product_option(
    product_id: str,
    option_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProductVariantOption).where(
            ProductVariantOption.id == option_id,
            ProductVariantOption.product_id == product_id,
            ProductVariantOption.tenant_id == user.tenant_id,
        )
    )
    option = result.scalar_one_or_none()
    if not option:
        raise HTTPException(status_code=404, detail="Option not found")

    await db.delete(option)
    await db.flush()
    return {"status": "deleted"}
