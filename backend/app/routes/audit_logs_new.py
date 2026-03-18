from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audit_log_core import AuditLog
from app.schemas.audit_log_api import AuditLogCreate, AuditLogResponse


router = APIRouter(prefix="/api/audit-logs", tags=["audit-logs"])


class AuditLogDetail(BaseModel):
    id: int
    timestamp: datetime
    type: str
    user: str
    user_name: Optional[str] = None
    item: Optional[str] = None
    status: str
    message: str
    ip_address: Optional[str] = None


@router.post("", response_model=AuditLogResponse, status_code=status.HTTP_201_CREATED)
def create_audit_log(log: AuditLogCreate, request: Request, db: Session = Depends(get_db)):
    payload = log.model_dump()
    payload["ip_address"] = request.client.host if request.client else None
    db_log = AuditLog(**payload)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    actor_type: Optional[str] = None,
    actor_id: Optional[str] = None,
    action: Optional[str] = None,
    result: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if actor_type:
        query = query.filter(AuditLog.actor_type == actor_type)
    if actor_id:
        query = query.filter(AuditLog.actor_id == actor_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if result:
        query = query.filter(AuditLog.result == result)
    return query.order_by(AuditLog.ts.desc()).offset(skip).limit(limit).all()


@router.get("/recent", response_model=List[AuditLogResponse])
def recent_audit_logs(hours: int = 24, limit: int = 100, db: Session = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    return (
        db.query(AuditLog)
        .filter(AuditLog.ts >= cutoff)
        .order_by(AuditLog.ts.desc())
        .limit(limit)
        .all()
    )


@router.get("/cabinet-access/recent", response_model=List[AuditLogDetail])
def cabinet_access_logs(hours: int = 24, limit: int = 100, db: Session = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    rows = db.execute(
        text(
            """
            SELECT
                al.id,
                al.ts AS timestamp,
                al.action AS type,
                COALESCE(al.actor_id, '') AS user,
                u.name AS user_name,
                al.target_id AS item,
                COALESCE(al.result, 'success') AS status,
                COALESCE(al.message, '') AS message,
                al.ip_address
            FROM public.audit_logs al
            LEFT JOIN public.users u ON u.nfc_card_uid = al.actor_id
            WHERE al.ts >= :cutoff
              AND al.action IN ('unlock', 'lock', 'scan')
            ORDER BY al.ts DESC
            LIMIT :limit
            """
        ),
        {"cutoff": cutoff, "limit": limit},
    ).mappings().all()
    return [dict(row) for row in rows]
