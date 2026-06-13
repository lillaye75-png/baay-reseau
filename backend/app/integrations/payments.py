import httpx
from app.core.config import settings


async def create_wave_checkout(amount_cfa: int, phone: str, order_id: str) -> dict:
    if not settings.WAVE_API_KEY or settings.WAVE_API_KEY == "dummy":
        return {
            "status": "demo",
            "payment_url": f"https://pay.wave.com/mock/checkout?amount={amount_cfa}&order={order_id}",
            "qr_data": f"wave://pay?amount={amount_cfa}&order={order_id}",
            "message": "Mode démo — configurez WAVE_API_KEY pour de vrai",
        }
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.wave.com/v1/checkout/sessions",
            headers={"Authorization": f"Bearer {settings.WAVE_API_KEY}"},
            json={
                "amount": amount_cfa,
                "currency": "XOF",
                "return_url": f"http://localhost:3000/pos?paid={order_id}",
                "error_url": f"http://localhost:3000/pos?error={order_id}",
                "order_id": order_id,
            },
        )
        return resp.json()


async def create_orange_money_link(amount_cfa: int, phone: str, order_id: str) -> dict:
    if not settings.ORANGE_MONEY_API_KEY or settings.ORANGE_MONEY_API_KEY == "dummy":
        return {
            "status": "demo",
            "payment_url": f"https://pay.orange.com/mock/checkout?amount={amount_cfa}&order={order_id}",
            "qr_data": f"om://pay?amount={amount_cfa}&order={order_id}",
            "message": "Mode démo — configurez ORANGE_MONEY_API_KEY pour de vrai",
        }

    token = await _get_orange_money_token()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.orange.com/orange-money-webpay/dev/v1/webpayment",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "merchant_key": settings.ORANGE_MONEY_API_KEY,
                "currency": "OUV",
                "order_id": order_id,
                "amount": amount_cfa,
                "return_url": f"http://localhost:3000/pos?paid={order_id}",
                "cancel_url": f"http://localhost:3000/pos?cancel={order_id}",
                "notif_url": f"http://localhost:8000/api/v1/whatsapp/webhook",
            },
        )
        return resp.json()


async def _get_orange_money_token() -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.orange.com/oauth/v3/token",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "client_credentials"},
            auth=(settings.ORANGE_MONEY_API_KEY, ""),
        )
        return resp.json().get("access_token", "")


def get_qr_svg(data: str) -> str:
    import urllib.parse
    encoded = urllib.parse.quote(data)
    return f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encoded}"
