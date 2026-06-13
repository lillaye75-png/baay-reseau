from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.customer import Customer
from app.models.tenant import Tenant
from app.integrations.whatsapp import send_whatsapp_message
from app.core.config import settings


async def check_and_send_stock_alerts(db: AsyncSession, tenant_id: str) -> list[dict]:
    result = await db.execute(
        select(Product).where(
            Product.tenant_id == tenant_id,
            Product.is_active == True,
            Product.stock_quantity <= Product.low_stock_threshold,
        )
    )
    low_stock = list(result.scalars().all())
    if not low_stock:
        return []

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        return []

    items_text = "\n".join([
        f"• {p.name}: {p.stock_quantity} {p.unit} (seuil: {p.low_stock_threshold})"
        for p in low_stock
    ])
    message = (
        f"⚠️ Alerte Stock — {tenant.name}\n\n"
        f"Ces produits sont en stock bas:\n{items_text}\n\n"
        f"Pensez à réapprovisionner avant que le stock ne s'épuise !"
    )

    sent = []
    if settings.WHATSAPP_API_TOKEN and settings.WHATSAPP_API_TOKEN != "dummy":
        try:
            await send_whatsapp_message(tenant.phone, message)
            sent.append({"phone": tenant.phone, "status": "sent"})
        except Exception as e:
            sent.append({"phone": tenant.phone, "status": "error", "error": str(e)})

    return {
        "low_stock_count": len(low_stock),
        "products": [{"name": p.name, "stock": p.stock_quantity, "threshold": p.low_stock_threshold} for p in low_stock],
        "message": message,
        "alerts_sent": sent,
    }


async def check_and_send_debt_alerts(db: AsyncSession, tenant_id: str) -> list[dict]:
    result = await db.execute(
        select(Customer).where(
            Customer.tenant_id == tenant_id,
            Customer.total_credit_cfa > 0,
        )
    )
    debtors = list(result.scalars().all())
    if not debtors:
        return []

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        return []

    items_text = "\n".join([
        f"• {c.name}{f' ({c.nickname})' if c.nickname else ''}: {c.total_credit_cfa:,} CFA"
        for c in sorted(debtors, key=lambda x: x.total_credit_cfa, reverse=True)
    ])
    total = sum(c.total_credit_cfa for c in debtors)
    message = (
        f"💰 Rappel Crédits — {tenant.name}\n\n"
        f"Clients avec crédit en cours:\n{items_text}\n\n"
        f"Total: {total:,} CFA\n"
        f"N'oubliez pas de demander les remboursements !"
    )

    sent = []
    if settings.WHATSAPP_API_TOKEN and settings.WHATSAPP_API_TOKEN != "dummy":
        try:
            await send_whatsapp_message(tenant.phone, message)
            sent.append({"phone": tenant.phone, "status": "sent"})
        except Exception as e:
            sent.append({"phone": tenant.phone, "status": "error", "error": str(e)})

    return {
        "debtors_count": len(debtors),
        "total_debt_cfa": total,
        "message": message,
        "alerts_sent": sent,
    }
