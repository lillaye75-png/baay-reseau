from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core.database import get_db
from app.api.deps import get_current_user, require_owner
from app.models.user import User
from app.models.push_subscription import PushSubscription
from app.services.fcm import send_push_v1

router = APIRouter()


@router.post("/subscribe")
async def subscribe_push(data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    endpoint = data.get("endpoint", "")
    p256dh = data.get("keys", {}).get("p256dh", "")
    auth = data.get("keys", {}).get("auth", "")

    if not endpoint or not p256dh or not auth:
        raise HTTPException(status_code=400, detail="Données de subscription invalides")

    result = await db.execute(
        select(PushSubscription).where(
            PushSubscription.endpoint == endpoint,
            PushSubscription.user_id == user.id,
        )
    )
    if result.scalar_one_or_none():
        return {"status": "already_subscribed"}

    sub = PushSubscription(
        tenant_id=user.tenant_id,
        user_id=user.id,
        endpoint=endpoint,
        p256dh=p256dh,
        auth=auth,
    )
    db.add(sub)
    await db.flush()
    return {"status": "subscribed"}


@router.post("/unsubscribe")
async def unsubscribe_push(data: dict, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    endpoint = data.get("endpoint", "")
    if endpoint:
        await db.execute(
            delete(PushSubscription).where(
                PushSubscription.endpoint == endpoint,
                PushSubscription.user_id == user.id,
            )
        )
        await db.flush()
    return {"status": "unsubscribed"}


@router.post("/send")
async def send_push(data: dict, user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    title = data.get("title", "Naatal ERP")
    body = data.get("body", "")
    target = data.get("target", "all")

    result = await db.execute(
        select(PushSubscription).where(PushSubscription.tenant_id == user.tenant_id)
    )
    subscriptions = list(result.scalars().all())

    if not subscriptions:
        return {"sent": 0, "message": "Aucun appareil abonné"}

    sent = 0
    for sub in subscriptions:
        try:
            ok = await send_push_v1(
                token=sub.endpoint,
                title=title,
                body=body,
                data={"tenant_id": user.tenant_id, "target": target},
            )
            if ok:
                sent += 1
            else:
                await db.execute(delete(PushSubscription).where(PushSubscription.id == sub.id))
        except Exception:
            await db.execute(delete(PushSubscription).where(PushSubscription.id == sub.id))

    await db.flush()
    return {"sent": sent, "total": len(subscriptions)}
