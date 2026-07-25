import json
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import decode_access_token
from app.core.database import get_db, async_session
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

connected_clients: dict[str, list[WebSocket]] = {}
MAX_EVENTS_PER_TENANT = 50


async def _push_event(tenant_id: str, event_type: str, data: dict, db=None):
    from sqlalchemy import text as sa_text
    import uuid
    from app.core.logging import logger
    try:
        if db is not None:
            await db.execute(
                sa_text(
                    "INSERT INTO event_queue (id, tenant_id, event_type, event_data, created_at) "
                    "VALUES (:id, :tenant_id, :event_type, :event_data, :created_at)"
                ),
                {
                    "id": str(uuid.uuid4()),
                    "tenant_id": tenant_id,
                    "event_type": event_type,
                    "event_data": json.dumps(data),
                    "created_at": int(time.time()),
                },
            )
            await db.execute(
                sa_text(
                    "DELETE FROM event_queue WHERE tenant_id = :tid AND id NOT IN "
                    "(SELECT id FROM event_queue WHERE tenant_id = :tid2 ORDER BY created_at DESC LIMIT :limit)"
                ),
                {"tid": tenant_id, "tid2": tenant_id, "limit": MAX_EVENTS_PER_TENANT},
            )
            await db.flush()
        else:
            async with async_session() as s:
                await s.execute(
                    sa_text(
                        "INSERT INTO event_queue (id, tenant_id, event_type, event_data, created_at) "
                        "VALUES (:id, :tenant_id, :event_type, :event_data, :created_at)"
                    ),
                    {
                        "id": str(uuid.uuid4()),
                        "tenant_id": tenant_id,
                        "event_type": event_type,
                        "event_data": json.dumps(data),
                        "created_at": int(time.time()),
                    },
                )
                await s.execute(
                    sa_text(
                        "DELETE FROM event_queue WHERE tenant_id = :tid AND id NOT IN "
                        "(SELECT id FROM event_queue WHERE tenant_id = :tid2 ORDER BY created_at DESC LIMIT :limit)"
                    ),
                    {"tid": tenant_id, "tid2": tenant_id, "limit": MAX_EVENTS_PER_TENANT},
                )
                await s.commit()
    except Exception as e:
        logger.warning(f"_push_event failed: {e}")


@router.get("/events/{tenant_id}")
async def get_events(
    tenant_id: str,
    since: float = Query(default=0, description="Unix timestamp to filter events since"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.tenant_id != tenant_id:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=403, content={"detail": "Not your tenant"})
    from sqlalchemy import text as sa_text
    result = await db.execute(
        sa_text(
            "SELECT event_type, event_data, created_at FROM event_queue "
            "WHERE tenant_id = :tid AND created_at > :since ORDER BY created_at"
        ),
        {"tid": tenant_id, "since": int(since)},
    )
    events = [
        {"type": row[0], "data": json.loads(row[1]) if isinstance(row[1], str) else row[1], "ts": row[2]}
        for row in result.all()
    ]
    return {"events": events, "server_time": time.time()}


@router.websocket("/ws/{tenant_id}")
async def websocket_endpoint(websocket: WebSocket, tenant_id: str, token: str = Query(default="")):
    if not token:
        await websocket.close(code=4001, reason="Token required")
        return

    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    ws_tenant = payload.get("tenant_id", "")
    if ws_tenant != tenant_id:
        await websocket.close(code=4003, reason="Tenant mismatch")
        return

    await websocket.accept()

    if tenant_id not in connected_clients:
        connected_clients[tenant_id] = []
    connected_clients[tenant_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        try:
            connected_clients[tenant_id].remove(websocket)
        except ValueError:
            pass
        if tenant_id in connected_clients and not connected_clients[tenant_id]:
            del connected_clients[tenant_id]


async def broadcast_to_tenant(tenant_id: str, event_type: str, data: dict, db=None):
    await _push_event(tenant_id, event_type, data, db=db)
    if tenant_id in connected_clients:
        message = json.dumps({"type": event_type, "data": data})
        disconnected = []
        for ws in connected_clients[tenant_id]:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            connected_clients[tenant_id].remove(ws)


async def notify_new_sale(tenant_id: str, sale_data: dict, db=None):
    await broadcast_to_tenant(tenant_id, "new_sale", sale_data, db=db)


async def notify_new_order(tenant_id: str, order_data: dict, db=None):
    await broadcast_to_tenant(tenant_id, "new_order", order_data, db=db)


async def notify_order_update(tenant_id: str, order_data: dict, db=None):
    await broadcast_to_tenant(tenant_id, "order_update", order_data, db=db)


async def notify_stock_alert(tenant_id: str, product_data: dict, db=None):
    await broadcast_to_tenant(tenant_id, "stock_alert", product_data, db=db)


async def notify_credit_update(tenant_id: str, credit_data: dict, db=None):
    await broadcast_to_tenant(tenant_id, "credit_update", credit_data, db=db)
