import json
import asyncio
import time
from collections import defaultdict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from app.core.security import decode_access_token

router = APIRouter()

connected_clients: dict[str, list[WebSocket]] = {}

MAX_EVENTS_PER_TENANT = 50
event_queues: dict[str, list[dict]] = defaultdict(list)

from app.api.deps import get_current_user
from app.models.user import User


def _push_event(tenant_id: str, event_type: str, data: dict):
    event_queues[tenant_id].append({
        "type": event_type,
        "data": data,
        "ts": time.time(),
    })
    if len(event_queues[tenant_id]) > MAX_EVENTS_PER_TENANT:
        event_queues[tenant_id] = event_queues[tenant_id][-MAX_EVENTS_PER_TENANT:]


@router.get("/events/{tenant_id}")
async def get_events(
    tenant_id: str,
    since: float = Query(default=0, description="Unix timestamp to filter events since"),
    user: User = Depends(get_current_user),
):
    if user.tenant_id != tenant_id:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=403, content={"detail": "Not your tenant"})
    events = [e for e in event_queues.get(tenant_id, []) if e["ts"] > since]
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


async def broadcast_to_tenant(tenant_id: str, event_type: str, data: dict):
    _push_event(tenant_id, event_type, data)
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


async def notify_new_sale(tenant_id: str, sale_data: dict):
    await broadcast_to_tenant(tenant_id, "new_sale", sale_data)


async def notify_new_order(tenant_id: str, order_data: dict):
    await broadcast_to_tenant(tenant_id, "new_order", order_data)


async def notify_order_update(tenant_id: str, order_data: dict):
    await broadcast_to_tenant(tenant_id, "order_update", order_data)


async def notify_stock_alert(tenant_id: str, product_data: dict):
    await broadcast_to_tenant(tenant_id, "stock_alert", product_data)


async def notify_credit_update(tenant_id: str, credit_data: dict):
    await broadcast_to_tenant(tenant_id, "credit_update", credit_data)
