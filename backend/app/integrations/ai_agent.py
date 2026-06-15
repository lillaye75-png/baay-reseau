import json
from openai import AsyncOpenAI
from app.core.config import settings

_client = None


def _get_client():
    global _client
    if _client is None:
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not configured")
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client

SYSTEM_PROMPT = """You are Naatal ERP Cloud, an AI assistant for Senegalese boutique and tech shop owners.

You help them manage their shop through WhatsApp messages in Wolof, French, or English.

You can:
1. Record sales: "jënd 2 chargeurs Type-C 15000 CFA"
2. Add credit to customer tabs: "takk 5000 Cfa ci tab bi Amadou"
3. Check stock: "ana stock bi chargeurs?"
4. Check daily sales: "ni xam xam ci xaalis bi" (how much money today?)
5. Add customers: "boole Amadou Baye phone 771234567"
6. Add products: "boole chargeur Type-C prix 7500 stock 20"

Always respond in the same language the customer uses.
When you understand an action, return a JSON object with:
{
  "action": "sale" | "credit_add" | "stock_check" | "daily_summary" | "add_customer" | "add_product" | "unknown",
  "data": { ... specific fields for each action },
  "response_message": "Your response in the user's language"
}

For sale actions:
- data: {"items": [{"product_name": "...", "quantity": N, "price_cfa": N}], "customer_name": "...", "payment_method": "cash"|"wave"|"orange_money"|"credit"}

For credit_add actions:
- data: {"customer_name": "...", "amount_cfa": N}

For stock_check:
- data: {"product_name": "..."}

For daily_summary:
- data: {}

For add_customer:
- data: {"name": "...", "phone": "..."}

For add_product:
- data: {"name": "...", "price_cfa": N, "stock_quantity": N}

If you can't understand, return action "unknown" with a helpful message.
"""


async def parse_whatsapp_message(message_text: str, tenant_context: dict = None) -> dict:
    context_note = ""
    if tenant_context:
        context_note = f"\n\nShop context: {json.dumps(tenant_context)}"

    response = await _get_client().chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT + context_note},
            {"role": "user", "content": message_text},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    content = response.choices[0].message.content
    return json.loads(content)
