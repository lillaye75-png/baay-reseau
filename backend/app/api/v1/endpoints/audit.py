from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_owner
from app.models.user import User
from app.models.audit_log import AuditLog

router = APIRouter()


@router.get("/")
async def list_audit_logs(
    limit: int = 100,
    entity_type: str = None,
    user: User = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    query = select(AuditLog).where(AuditLog.tenant_id == user.tenant_id)
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    query = query.order_by(AuditLog.created_at.desc()).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    return [{
        "id": l.id,
        "user_name": l.user_name,
        "action": l.action,
        "entity_type": l.entity_type,
        "entity_id": l.entity_id,
        "details": l.details,
        "created_at": l.created_at.isoformat(),
    } for l in logs]


@router.get("/stats")
async def audit_stats(user: User = Depends(require_owner), db: AsyncSession = Depends(get_db)):
    total = (await db.execute(
        select(func.count(AuditLog.id)).where(AuditLog.tenant_id == user.tenant_id)
    )).scalar()

    result = await db.execute(
        select(AuditLog.entity_type, func.count(AuditLog.id))
        .where(AuditLog.tenant_id == user.tenant_id)
        .group_by(AuditLog.entity_type)
    )
    by_entity = {row[0]: row[1] for row in result.all()}

    return {"total": total, "by_entity": by_entity}
