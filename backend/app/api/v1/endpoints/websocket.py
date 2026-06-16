import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

connected_clients: dict[str, list[WebSocket]] = {}


@router.websocket("/ws/{tenant_id}")
async def websocket_endpoint(websocket: WebSocket, tenant_id: str):
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
        connected_clients[tenant_id].remove(websocket)
        if not connected_clients[tenant_id]:
            del connected_clients[tenant_id]


async def broadcast_to_tenant(tenant_id: str, event_type: str, data: dict):
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


async def notify_stock_alert(tenant_id: str, product_data: dict):
    await broadcast_to_tenant(tenant_id, "stock_alert", product_data)


async def notify_credit_update(tenant_id: str, credit_data: dict):
    await broadcast_to_tenant(tenant_id, "credit_update", credit_data)
