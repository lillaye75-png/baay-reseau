"""Backfill product_name on existing sale_items."""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import async_session
from app.models.sale import SaleItem
from app.models.product import Product


async def backfill():
    async with async_session() as db:
        result = await db.execute(select(SaleItem).where(SaleItem.product_name == ""))
        items = result.scalars().all()
        print(f"Found {len(items)} sale_items with empty product_name")

        for item in items:
            prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
            product = prod_result.scalar_one_or_none()
            if product:
                item.product_name = product.name
                print(f"  {item.id[:8]}... -> {product.name}")

        await db.commit()
        print("Done!")


if __name__ == "__main__":
    asyncio.run(backfill())
