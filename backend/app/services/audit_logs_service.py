from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import Request
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.audit_log_core import AuditLog
from app.schemas.audit_log_api import AuditLogCreate


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


KIOSK_LAST_SEEN: Dict[str, datetime] = {}


def create_audit_log(db: Session, log: AuditLogCreate, request: Request) -> AuditLog:
    payload = log.model_dump()
    payload["ip_address"] = request.client.host if request.client else None
    db_log = AuditLog(**payload)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


def list_audit_logs(
    db: Session,
    actor_type: Optional[str],
    actor_id: Optional[str],
    action: Optional[str],
    result: Optional[str],
    skip: int,
    limit: int,
) -> List[AuditLog]:
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


def recent_audit_logs(db: Session, hours: int, limit: int) -> List[AuditLog]:
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    return db.query(AuditLog).filter(AuditLog.ts >= cutoff).order_by(AuditLog.ts.desc()).limit(limit).all()


def recent_cabinet_access_logs(db: Session, hours: int, limit: int) -> List[AuditLogDetail]:
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
    return [AuditLogDetail(**dict(row)) for row in rows]


def record_kiosk_heartbeat(db: Session, kiosk_id: str, payload: str) -> None:
    now = datetime.utcnow()
    KIOSK_LAST_SEEN[kiosk_id] = now
    db_log = AuditLog(
        actor_type="device",
        actor_id=kiosk_id,
        action="heartbeat",
        target_type="kiosk",
        target_id=kiosk_id,
        result="success",
        message=payload,
    )
    db.add(db_log)
    db.commit()


def list_kiosk_status() -> List[dict]:
    return [
        {"kiosk_id": kiosk_id, "last_seen": timestamp.isoformat() + "Z"}
        for kiosk_id, timestamp in sorted(KIOSK_LAST_SEEN.items())
    ]


def get_kiosk_status(kiosk_id: str) -> dict:
    last_seen = KIOSK_LAST_SEEN.get(kiosk_id)
    if not last_seen:
        return {"kiosk_id": kiosk_id, "last_seen": None, "status": "not_seen"}

    delta = datetime.utcnow() - last_seen
    status_value = "online" if delta.total_seconds() <= 120 else "stale"
    return {
        "kiosk_id": kiosk_id,
        "last_seen": last_seen.isoformat() + "Z",
        "status": status_value,
    }
