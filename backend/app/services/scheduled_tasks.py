import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, func

from app.core.database import async_session
from app.models.tenant import Tenant
from app.models.product import Product
from app.models.sale import Sale, SaleItem
from app.models.customer import Customer
from app.integrations.whatsapp import send_whatsapp_message


async def check_low_stock():
    """Send low stock alerts to shop owners."""
    async with async_session() as db:
        result = await db.execute(
            select(Product).where(
                Product.is_active == True,
                Product.stock_quantity <= Product.low_stock_threshold,
            )
        )
        low_stock_products = result.scalars().all()
        
        tenant_products = {}
        for product in low_stock_products:
            if product.tenant_id not in tenant_products:
                tenant_products[product.tenant_id] = []
            tenant_products[product.tenant_id].append(product)
        
        for tenant_id, products in tenant_products.items():
            tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
            tenant = tenant_result.scalar_one_or_none()
            if not tenant or not tenant.phone:
                continue
            
            items_text = "\n".join([
                f"• {p.name}: {p.stock_quantity} {p.unit} (seuil: {p.low_stock_threshold})"
                for p in products[:10]
            ])
            
            message = (
                f"⚠️ *Alerte Stock Bas*\n\n"
                f"Les produits suivants sont en stock bas:\n\n"
                f"{items_text}\n\n"
                f"Reapprovisionnez au plus vite!"
            )
            
            await send_whatsapp_message(tenant.phone, message)


async def send_daily_summary():
    """Send daily sales summary to shop owners."""
    async with async_session() as db:
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        
        tenants_result = await db.execute(select(Tenant))
        tenants = tenants_result.scalars().all()
        
        for tenant in tenants:
            if not tenant.phone:
                continue
            
            sales_result = await db.execute(
                select(func.count(Sale.id), func.sum(Sale.total_cfa))
                .where(
                    Sale.tenant_id == tenant.id,
                    Sale.created_at >= today,
                    Sale.created_at < tomorrow,
                )
            )
            sale_count, total_revenue = sales_result.one()
            sale_count = sale_count or 0
            total_revenue = total_revenue or 0
            
            credit_result = await db.execute(
                select(func.count(Sale.id))
                .where(
                    Sale.tenant_id == tenant.id,
                    Sale.is_credit == True,
                    Sale.created_at >= today,
                    Sale.created_at < tomorrow,
                )
            )
            credit_count = credit_result.scalar() or 0
            
            products_result = await db.execute(
                select(Product)
                .where(
                    Product.tenant_id == tenant.id,
                    Product.is_active == True,
                    Product.stock_quantity <= Product.low_stock_threshold,
                )
            )
            low_stock_count = len(products_result.scalars().all())
            
            message = (
                f"📊 *Résumé Quotidien*\n\n"
                f"📅 {today.strftime('%d/%m/%Y')}\n\n"
                f"💰 Ventes: {sale_count}\n"
                f"💵 Revenu: {total_revenue:,.0f} CFA\n"
                f"📝 Crédits: {credit_count}\n"
            )
            
            if low_stock_count > 0:
                message += f"\n⚠️ *{low_stock_count} produit(s) en stock bas*"
            
            message += f"\n\nBonne journée!"
            
            await send_whatsapp_message(tenant.phone, message)


async def check_credit_reminders():
    """Send credit payment reminders."""
    async with async_session() as db:
        result = await db.execute(
            select(Customer).where(
                Customer.total_credit_cfa > 0,
            )
        )
        customers_with_credit = result.scalars().all()
        
        tenant_customers = {}
        for customer in customers_with_credit:
            if customer.tenant_id not in tenant_customers:
                tenant_customers[customer.tenant_id] = []
            tenant_customers[customer.tenant_id].append(customer)
        
        for tenant_id, customers in tenant_customers.items():
            tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
            tenant = tenant_result.scalar_one_or_none()
            if not tenant or not tenant.phone:
                continue
            
            total_debt = sum(c.total_credit_cfa for c in customers)
            
            if total_debt > 0:
                message = (
                    f"📝 *Rappel Crédits*\n\n"
                    f"Total crédits en cours: {total_debt:,.0f} CFA\n"
                    f"Nombre de clients: {len(customers)}\n\n"
                    f"Top débiteurs:\n"
                )
                
                sorted_customers = sorted(customers, key=lambda c: c.total_credit_cfa, reverse=True)[:5]
                for c in sorted_customers:
                    message += f"• {c.name}: {c.total_credit_cfa:,.0f} CFA\n"
                
                await send_whatsapp_message(tenant.phone, message)


async def run_scheduled_tasks():
    """Main scheduler loop."""
    while True:
        try:
            now = datetime.now(timezone.utc)
            
            if now.hour == 8 and now.minute == 0:
                try:
                    await send_daily_summary()
                except Exception as e:
                    print(f"Error in daily summary: {e}")
            
            if now.hour == 9 and now.minute == 0:
                try:
                    await check_low_stock()
                except Exception as e:
                    print(f"Error in low stock check: {e}")
            
            if now.hour == 10 and now.minute == 0:
                try:
                    await check_credit_reminders()
                except Exception as e:
                    print(f"Error in credit reminders: {e}")
        except Exception as e:
            print(f"Scheduler error: {e}")
        
        await asyncio.sleep(60)


def start_scheduler():
    """Start the scheduler in background."""
    asyncio.create_task(run_scheduled_tasks())
