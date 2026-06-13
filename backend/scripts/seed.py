"""
Seed script: populates the database with sample products for demo.
Run: python -m scripts.seed
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base, async_session
from app.models.tenant import Tenant
from app.models.user import User
from app.models.product import Product, ProductCategory
from app.models.customer import Customer
from app.core.security import hash_password

SAMPLE_PRODUCTS = [
    {"name": "Câble Type-C (1m)", "sku": "CBL-TC1", "price_cfa": 2500, "cost_price_cfa": 1200, "stock_quantity": 50, "low_stock_threshold": 10, "unit": "piece"},
    {"name": "Câble Type-C (2m)", "sku": "CBL-TC2", "price_cfa": 3500, "cost_price_cfa": 1800, "stock_quantity": 30, "low_stock_threshold": 10, "unit": "piece"},
    {"name": "Chargeur mural Samsung", "sku": "CHG-SAM", "price_cfa": 8000, "cost_price_cfa": 4500, "stock_quantity": 25, "low_stock_threshold": 5, "unit": "piece"},
    {"name": "Chargeur mural iPhone", "sku": "CHG-IPH", "price_cfa": 10000, "cost_price_cfa": 5500, "stock_quantity": 20, "low_stock_threshold": 5, "unit": "piece"},
    {"name": "Chargeur double port USB", "sku": "CHG-Dual", "price_cfa": 6000, "cost_price_cfa": 3000, "stock_quantity": 35, "low_stock_threshold": 8, "unit": "piece"},
    {"name": "Batterie externe 10000mAh", "sku": "BAT-10K", "price_cfa": 15000, "cost_price_cfa": 8000, "stock_quantity": 12, "low_stock_threshold": 3, "unit": "piece"},
    {"name": "Batterie externe 20000mAh", "sku": "BAT-20K", "price_cfa": 25000, "cost_price_cfa": 14000, "stock_quantity": 8, "low_stock_threshold": 3, "unit": "piece"},
    {"name": "Écouteurs Bluetooth", "sku": "EAR-BT", "price_cfa": 5000, "cost_price_cfa": 2000, "stock_quantity": 40, "low_stock_threshold": 10, "unit": "piece"},
    {"name": "Écouteurs Filaires", "sku": "EAR-W", "price_cfa": 1500, "cost_price_cfa": 500, "stock_quantity": 100, "low_stock_threshold": 20, "unit": "piece"},
    {"name": "Coque Samsung Galaxy A14", "sku": "CS-A14", "price_cfa": 2000, "cost_price_cfa": 800, "stock_quantity": 30, "low_stock_threshold": 10, "unit": "piece"},
    {"name": "Coque iPhone 14", "sku": "CS-IP14", "price_cfa": 3000, "cost_price_cfa": 1200, "stock_quantity": 25, "low_stock_threshold": 8, "unit": "piece"},
    {"name": "Vitre trempée Samsung", "sku": "GT-SAM", "price_cfa": 1500, "cost_price_cfa": 400, "stock_quantity": 45, "low_stock_threshold": 15, "unit": "piece"},
    {"name": "Vitre trempée iPhone", "sku": "GT-IPH", "price_cfa": 2000, "cost_price_cfa": 500, "stock_quantity": 40, "low_stock_threshold": 15, "unit": "piece"},
    {"name": "Support téléphone adjustable", "sku": "SUP-TEL", "price_cfa": 3000, "cost_price_cfa": 1500, "stock_quantity": 20, "low_stock_threshold": 5, "unit": "piece"},
    {"name": "Clé USB 32Go", "sku": "USB-32", "price_cfa": 4000, "cost_price_cfa": 2000, "stock_quantity": 30, "low_stock_threshold": 10, "unit": "piece"},
    {"name": "Clé USB 64Go", "sku": "USB-64", "price_cfa": 6000, "cost_price_cfa": 3500, "stock_quantity": 15, "low_stock_threshold": 5, "unit": "piece"},
    {"name": "Carte SD 64Go", "sku": "SD-64", "price_cfa": 4500, "cost_price_cfa": 2500, "stock_quantity": 20, "low_stock_threshold": 8, "unit": "piece"},
    {"name": "Adaptateur HDMI", "sku": "ADP-HDMI", "price_cfa": 5000, "cost_price_cfa": 2500, "stock_quantity": 3, "low_stock_threshold": 5, "unit": "piece"},
    {"name": "Lampe torche LED rechargeable", "sku": "LMP-LED", "price_cfa": 3500, "cost_price_cfa": 1500, "stock_quantity": 25, "low_stock_threshold": 10, "unit": "piece"},
    {"name": "Panneau solaire portable", "sku": "SOL-PRT", "price_cfa": 35000, "cost_price_cfa": 20000, "stock_quantity": 2, "low_stock_threshold": 3, "unit": "piece"},
]

SAMPLE_CUSTOMERS = [
    {"name": "Amadou Diop", "nickname": "Amadou baye", "phone": "771112233", "whatsapp_number": "221771112233", "notes": "Client fidèle, vient souvent le matin"},
    {"name": "Fatou Sall", "nickname": "Fatou", "phone": "782223344", "whatsapp_number": "221782223344", "notes": ""},
    {"name": "Ibrahima Ndiaye", "nickname": "Ibra", "phone": "763334455", "whatsapp_number": "", "notes": "Achète souvent des câbles"},
    {"name": "Mariama Ba", "nickname": "Mariama", "phone": "774445566", "whatsapp_number": "221774445566", "notes": "Gère un cyber au Plateau"},
    {"name": "Ousmane Fall", "nickname": "Ousmane", "phone": "785556677", "whatsapp_number": "221785556677", "notes": ""},
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.phone == "771234567"))
        if not result.scalar_one_or_none():
            print("Creating test account...")
            tenant = Tenant(name="Baay Test Shop", slug="shop-test-771234567", phone="771234567")
            db.add(tenant)
            await db.flush()

            user = User(
                tenant_id=tenant.id,
                name="Admin Baay",
                phone="771234567",
                password_hash=hash_password("admin123"),
                role="owner",
            )
            db.add(user)
            await db.flush()
        else:
            tenant_result = await db.execute(select(Tenant).where(Tenant.phone == "771234567"))
            tenant = tenant_result.scalar_one()
            print("Test account exists, adding data...")

        cat_elec = ProductCategory(name="Électronique", name_wo="Electronique", tenant_id=tenant.id)
        cat_access = ProductCategory(name="Accessoires", name_wo="Accessoir yi", tenant_id=tenant.id)
        db.add(cat_elec)
        db.add(cat_access)
        await db.flush()

        existing = await db.execute(
            select(Product).where(Product.tenant_id == tenant.id)
        )
        if not existing.scalars().first():
            print(f"Adding {len(SAMPLE_PRODUCTS)} products...")
            for p_data in SAMPLE_PRODUCTS:
                cat = cat_elec if "Câble" in p_data["name"] or "Chargeur" in p_data["name"] or "Batterie" in p_data["name"] else cat_access
                product = Product(tenant_id=tenant.id, category_id=cat.id, **p_data)
                db.add(product)
        else:
            print("Products already exist, skipping.")

        existing_cust = await db.execute(
            select(Customer).where(Customer.tenant_id == tenant.id)
        )
        if not existing_cust.scalars().first():
            print(f"Adding {len(SAMPLE_CUSTOMERS)} customers...")
            for c_data in SAMPLE_CUSTOMERS:
                customer = Customer(tenant_id=tenant.id, **c_data)
                db.add(customer)
        else:
            print("Customers already exist, skipping.")

        await db.commit()
        print("\nSeed complete!")
        print("Login: Phone=771234567  Password=admin123")


if __name__ == "__main__":
    asyncio.run(seed())
