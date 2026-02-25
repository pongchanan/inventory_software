from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogCreate, AuditLogResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/audit-logs", tags=["audit-logs"])


class AuditLogDetail(BaseModel):
    """Enhanced audit log with user details"""
    id: int
    timestamp: datetime
    type: str
    user: str
    user_name: Optional[str]
    item: Optional[str]
    status: str
    message: str
    ip_address: Optional[str]
    
    class Config:
        from_attributes = True


@router.post("/", response_model=AuditLogResponse, status_code=status.HTTP_201_CREATED)
def create_audit_log(
    log: AuditLogCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new audit log entry"""
    db_log = AuditLog(**log.model_dump())
    db_log.ip_address = request.client.host if request.client else None
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.get("/recent", response_model=List[AuditLogResponse])
def get_recent_logs(
    hours: int = 24,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get recent audit logs (last N hours)"""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    logs = db.query(AuditLog).filter(
        AuditLog.timestamp >= cutoff
    ).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs


@router.get("/", response_model=List[AuditLogResponse])
def list_audit_logs(
    type_filter: Optional[str] = None,
    user: Optional[str] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List audit logs with filtering"""
    query = db.query(AuditLog)
    
    if type_filter:
        query = query.filter(AuditLog.type == type_filter)
    
    if user:
        query = query.filter(AuditLog.user == user)
    
    if status_filter:
        query = query.filter(AuditLog.status == status_filter)
    
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()


@router.get("/{log_id}", response_model=AuditLogResponse)
def get_audit_log(log_id: int, db: Session = Depends(get_db)):
    """Get a specific audit log entry"""
    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit log {log_id} not found"
        )
    return log


@router.get("/cabinet-access/recent", response_model=List[AuditLogDetail])
def get_cabinet_access_logs(
    hours: int = 24,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get recent cabinet unlock/access events with user details"""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    
    # Filter for unlock events (cabinet access)
    logs = db.query(AuditLog).filter(
        AuditLog.timestamp >= cutoff,
        AuditLog.type.in_(["unlock", "lock", "scan"])
    ).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    # Enrich with user details
    log_details = []
    for log in logs:
        user = db.query(User).filter(User.uid == log.user).first()
        
        log_details.append(AuditLogDetail(
            id=log.id,
            timestamp=log.timestamp,
            type=log.type,
            user=log.user,
            user_name=user.name if user else "Unknown User",
            item=log.item,
            status=log.status,
            message=log.message,
            ip_address=log.ip_address
        ))
    
    return log_details

