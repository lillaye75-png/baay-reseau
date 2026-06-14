import os
import httpx

AT_API_KEY = os.getenv("AT_API_KEY", "")
AT_USERNAME = os.getenv("AT_USERNAME", "")
AT_SENDER_ID = os.getenv("AT_SENDER_ID", "BAAY")
AT_BASE_URL = "https://api.africastalking.com/version1/messaging"


async def send_sms(phone: str, message: str) -> bool:
    if not AT_API_KEY or not AT_USERNAME:
        return False

    headers = {
        "apiKey": AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    }
    data = {
        "username": AT_USERNAME,
        "to": phone,
        "message": message,
    }
    if AT_SENDER_ID:
        data["from"] = AT_SENDER_ID

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(AT_BASE_URL, headers=headers, data=data, timeout=10)
            result = resp.json()
            recipients = result.get("SMSMessageData", {}).get("Recipients", [])
            return any(r.get("status") == "Success" for r in recipients)
    except Exception:
        return False


async def send_sms_receipt(
    phone: str,
    shop_name: str,
    sale_id: str,
    items: list[dict],
    total: int,
    payment_method: str,
) -> bool:
    items_text = "\n".join([
        f"  {item['name']} x{item['quantity']} = {item['total_cfa']:,} F"
        for item in items[:5]
    ])
    if len(items) > 5:
        items_text += f"\n  ... +{len(items) - 5} autres"

    payment_labels = {
        "cash": "Espèces",
        "wave": "Wave",
        "orange_money": "Orange Money",
        "credit": "Crédit",
    }

    message = (
        f"*{shop_name}*\n"
        f"Ticket #{sale_id[:8].upper()}\n"
        f"{'─' * 24}\n"
        f"{items_text}\n"
        f"{'─' * 24}\n"
        f"Total: *{total:,} CFA*\n"
        f"Paiement: {payment_labels.get(payment_method, payment_method)}\n"
        f"{'─' * 24}\n"
        f"Mèrsi, dëgg na tànggi!"
    )

    return await send_sms(phone, message)


async def send_low_stock_sms(phone: str, product_name: str, current_stock: int) -> bool:
    message = (
        f"⚠️ *Alerte Stock*\n\n"
        f"{product_name}: {current_stock} restant(s)\n"
        f"Réapprovisionnez vite!"
    )
    return await send_sms(phone, message)
