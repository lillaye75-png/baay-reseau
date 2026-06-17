import hashlib
import hmac

from fastapi import APIRouter, Depends, Request, Response, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import require_owner
from app.models.user import User
from app.models.tenant import Tenant
from app.models.customer import Customer
from app.models.product import Product
from app.integrations.whatsapp import send_whatsapp_message
from app.integrations.ai_agent import parse_whatsapp_message
from app.services.sales import create_sale
from app.schemas.sale import SaleCreate, SaleItemCreate

router = APIRouter()


def verify_meta_signature(body: bytes, signature: str | None) -> bool:
    if not settings.WHATSAPP_API_TOKEN or settings.WHATSAPP_API_TOKEN == "dummy":
        return True
    if not signature:
        return False
    expected = "sha256=" + hmac.new(
        settings.WHATSAPP_API_TOKEN.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.get("/webhook")
async def verify_webhook(request: Request):
    params = dict(request.query_params)
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
        return Response(content=challenge, media_type="text/plain")
    return Response(status_code=403)


@router.post("/webhook")
async def receive_whatsapp_message(request: Request, db: AsyncSession = Depends(get_db)):
    body_bytes = await request.body()
    signature = request.headers.get("X-Hub-Signature-256")

    if not verify_meta_signature(body_bytes, signature):
        return Response(status_code=403)

    import json
    body = json.loads(body_bytes)

    if not body.get("entry"):
        return {"status": "ok"}

    for entry in body["entry"]:
        for change in entry.get("changes", []):
            value = change.get("value", {})
            messages = value.get("messages", [])
            if not messages:
                continue

            for message in messages:
                phone = message.get("from")
                text = ""
                for msg_type in ["text", "interactive"]:
                    if message.get(msg_type):
                        if msg_type == "text":
                            text = message["text"].get("body", "")
                        elif msg_type == "interactive":
                            text = message["interactive"].get("button", {}).get("id", "")

                if not text:
                    continue

                result = await handle_whatsapp_command(phone, text, db)
                if result:
                    await send_whatsapp_message(phone, result)

    return {"status": "ok"}


async def handle_whatsapp_command(phone: str, text: str, db: AsyncSession) -> str | None:
    tenant_result = await db.execute(select(Tenant).where(Tenant.phone == phone))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        return "Jàkk, duma maax tiitre shop bi. Ndax tektalilu ko ci app bi."

    products_result = await db.execute(
        select(Product).where(Product.tenant_id == tenant.id, Product.is_active == True)
    )
    products = list(products_result.scalars().all())

    customers_result = await db.execute(
        select(Customer).where(Customer.tenant_id == tenant.id)
    )
    customers = list(customers_result.scalars().all())

    context = {
        "shop_name": tenant.name,
        "products": [{"name": p.name, "price": p.price_cfa, "stock": p.stock_quantity} for p in products],
        "customers": [{"name": c.name, "nickname": c.nickname, "credit": c.total_credit_cfa} for c in customers],
    }

    parsed = await parse_whatsapp_message(text, context)
    action = parsed.get("action", "unknown")
    response_message = parsed.get("response_message", "Duma fahm li nga wax.")

    if action == "sale":
        data = parsed.get("data", {})
        try:
            items = []
            for item in data.get("items", []):
                product = next((p for p in products if p.name.lower() in item.get("product_name", "").lower()), None)
                if product:
                    items.append(SaleItemCreate(
                        product_id=product.id,
                        quantity=item.get("quantity", 1),
                        unit_price_cfa=item.get("price_cfa", product.price_cfa),
                    ))
            if items:
                customer = None
                customer_name = data.get("customer_name")
                if customer_name:
                    customer = next((c for c in customers if customer_name.lower() in c.name.lower()), None)
                sale_data = SaleCreate(
                    customer_id=customer.id if customer else None,
                    items=items,
                    payment_method=data.get("payment_method", "cash"),
                    is_credit=data.get("payment_method") == "credit",
                )
                await create_sale(db, tenant.id, sale_data)
        except Exception:
            pass

    elif action == "credit_add":
        data = parsed.get("data", {})
        customer_name = data.get("customer_name", "")
        amount = data.get("amount_cfa", 0)
        customer = next((c for c in customers if customer_name.lower() in c.name.lower()), None)
        if customer:
            from app.models.credit_tab import CreditTab, CreditTabEntry
            tab_result = await db.execute(
                select(CreditTab).where(CreditTab.customer_id == customer.id, CreditTab.is_active == True)
            )
            tab = tab_result.scalar_one_or_none()
            if tab:
                tab.balance_cfa -= amount
                entry = CreditTabEntry(tab_id=tab.id, amount_cfa=-amount, description="Payment via WhatsApp")
                db.add(entry)
                customer.total_credit_cfa -= amount
                if customer.total_credit_cfa < 0:
                    customer.total_credit_cfa = 0

    elif action == "add_customer":
        data = parsed.get("data", {})
        new_customer = Customer(
            tenant_id=tenant.id,
            name=data.get("name", ""),
            phone=data.get("phone"),
        )
        db.add(new_customer)

    elif action == "add_product":
        data = parsed.get("data", {})
        new_product = Product(
            tenant_id=tenant.id,
            name=data.get("name", ""),
            price_cfa=data.get("price_cfa", 0),
            stock_quantity=data.get("stock_quantity", 0),
        )
        db.add(new_product)

    await db.flush()
    return response_message


@router.post("/campaigns")
async def create_campaign(data: dict, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    from app.models.customer import Customer
    from app.core.database import Base
    from sqlalchemy import Column, String, Integer, DateTime, Text
    import uuid
    from datetime import datetime, timezone

    customers_result = await db.execute(
        select(Customer).where(Customer.tenant_id == user.tenant_id)
    )
    customers = list(customers_result.scalars().all())

    recipients = data.get("recipients", "all")
    message = data.get("message", "")
    name = data.get("name", f"Campaign {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}")

    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    recipient_phones = []
    if recipients == "all":
        recipient_phones = [c.phone for c in customers if c.phone]
    elif recipients == "credit":
        recipient_phones = [c.phone for c in customers if c.phone and c.total_credit_cfa > 0]
    elif isinstance(recipients, list):
        recipient_phones = [c.phone for c in customers if c.phone and c.id in recipients]

    sent_count = 0
    failed_count = 0
    for phone in recipient_phones:
        try:
            from app.integrations.whatsapp import send_whatsapp_message
            await send_whatsapp_message(phone, message)
            sent_count += 1
        except Exception:
            failed_count += 1

    return {
        "status": "completed",
        "name": name,
        "recipient_count": len(recipient_phones),
        "sent_count": sent_count,
        "failed_count": failed_count,
    }


@router.get("/campaigns")
async def list_campaigns(user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    from app.models.customer import Customer
    customers_result = await db.execute(
        select(Customer).where(Customer.tenant_id == user.tenant_id)
    )
    customers = list(customers_result.scalars().all())
    return {
        "total_customers": len(customers),
        "customers_with_phone": len([c for c in customers if c.phone]),
        "customers_with_credit": len([c for c in customers if c.total_credit_cfa > 0]),
    }
