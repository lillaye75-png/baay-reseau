from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import json
import time

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User

router = APIRouter()


@router.get("/events/{tenant_id}")
async def get_events(
    tenant_id: str,
    since: float = Query(default=0, description="Unix timestamp"),
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
