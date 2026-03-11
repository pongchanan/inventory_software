from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AuditLogCreate(BaseModel):
    actor_type: str  # user, system, device, admin
    actor_id: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    result: Optional[str] = None  # success, failed
    ip_address: Optional[str] = None
    message: Optional[str] = None
    correlation_id: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: int
    ts: datetime
    actor_type: str
    actor_id: Optional[str]
    action: str
    target_type: Optional[str]
    target_id: Optional[str]
    result: Optional[str]
    ip_address: Optional[str]
    message: Optional[str]
    correlation_id: Optional[str]

    class Config:
        from_attributes = True
