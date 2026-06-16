import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user, require_owner
from app.models.user import User

router = APIRouter()

fcm_subscriptions: dict[str, list[str]] = {}


@router.post("/subscribe")
async def subscribe_push(data: dict, user: User = Depends(get_current_user)):
    token = data.get("token", "")
    if not token:
        raise HTTPException(status_code=400, detail="FCM token requis")

    tenant_id = user.tenant_id
    if tenant_id not in fcm_subscriptions:
        fcm_subscriptions[tenant_id] = []
    if token not in fcm_subscriptions[tenant_id]:
        fcm_subscriptions[tenant_id].append(token)

    return {"status": "subscribed", "tenant_id": tenant_id}


@router.post("/unsubscribe")
async def unsubscribe_push(data: dict, user: User = Depends(get_current_user)):
    token = data.get("token", "")
    tenant_id = user.tenant_id
    if tenant_id in fcm_subscriptions and token in fcm_subscriptions[tenant_id]:
        fcm_subscriptions[tenant_id].remove(token)
    return {"status": "unsubscribed"}


@router.post("/send")
async def send_push(data: dict, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    if not settings.FCM_SERVER_KEY:
        raise HTTPException(status_code=501, detail="FCM non configuré")

    title = data.get("title", "Naatal ERP")
    body = data.get("body", "")
    target = data.get("target", "all")

    tokens = fcm_subscriptions.get(user.tenant_id, [])
    if not tokens:
        return {"sent": 0, "message": "Aucun appareil abonné"}

    sent = 0
    async with httpx.AsyncClient() as client:
        for token in tokens:
            try:
                resp = await client.post(
                    "https://fcm.googleapis.com/fcm/send",
                    headers={
                        "Authorization": f"key={settings.FCM_SERVER_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "to": token,
                        "notification": {"title": title, "body": body},
                        "data": {"tenant_id": user.tenant_id, "target": target},
                    },
                    timeout=10,
                )
                if resp.status_code == 200:
                    sent += 1
            except Exception:
                pass

    return {"sent": sent, "total": len(tokens)}
