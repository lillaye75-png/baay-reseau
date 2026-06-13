import os
from typing import Optional

AT_API_KEY = os.getenv("AT_API_KEY", "")
AT_USERNAME = os.getenv("AT_USERNAME", "")
AT_SENDER_ID = os.getenv("AT_SENDER_ID", "BAAY")


async def send_sms_receipt(
    phone: str,
    shop_name: str,
    sale_id: str,
    items: list[dict],
    total: int,
    payment_method: str,
) -> bool:
    """Send receipt via SMS using Africa's Talking."""
    if not AT_API_KEY or not AT_USERNAME:
        return False

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

    try:
        import africastalking
        africastalking.initialize(AT_USERNAME, AT_API_KEY)
        sms = africastalking.SMS
        result = sms.send(message, [phone], sender_id=AT_SENDER_ID)
        return result.get("SMSMessageData", {}).get("Recipients", [{}])[0].get("status") == "Success"
    except Exception:
        return False


async def send_low_stock_sms(phone: str, product_name: str, current_stock: int) -> bool:
    """Send low stock alert via SMS."""
    if not AT_API_KEY or not AT_USERNAME:
        return False

    message = (
        f"⚠️ *Alerte Stock*\n\n"
        f"{product_name}: {current_stock} restant(s)\n"
        f"Réapprovisionnez vite!"
    )

    try:
        import africastalking
        africastalking.initialize(AT_USERNAME, AT_API_KEY)
        sms = africastalking.SMS
        result = sms.send(message, [phone], sender_id=AT_SENDER_ID)
        return result.get("SMSMessageData", {}).get("Recipients", [{}])[0].get("status") == "Success"
    except Exception:
        return False
