from typing import List, Optional

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.audit_log_api import AuditLogCreate, AuditLogResponse
from app.services.audit_logs_service import (
    AuditLogDetail,
    create_audit_log,
    list_audit_logs,
    recent_audit_logs,
    recent_cabinet_access_logs,
)


router = APIRouter(prefix="/api/audit-logs", tags=["audit-logs"])


@router.post("", response_model=AuditLogResponse, status_code=status.HTTP_201_CREATED)
def create_audit_log_route(log: AuditLogCreate, request: Request, db: Session = Depends(get_db)):
    return create_audit_log(db, log, request)


@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs_route(
    actor_type: Optional[str] = None,
    actor_id: Optional[str] = None,
    action: Optional[str] = None,
    result: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return list_audit_logs(db, actor_type, actor_id, action, result, skip, limit)


@router.get("/recent", response_model=List[AuditLogResponse])
def recent_audit_logs_route(hours: int = 24, limit: int = 100, db: Session = Depends(get_db)):
    return recent_audit_logs(db, hours, limit)


@router.get("/cabinet-access/recent", response_model=List[AuditLogDetail])
def cabinet_access_logs(hours: int = 24, limit: int = 100, db: Session = Depends(get_db)):
    return recent_cabinet_access_logs(db, hours, limit)
