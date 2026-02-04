from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AuditLogBase(BaseModel):
    type: str  # scan, unlock, lock, sync, approval, violation
    user: str
    item: Optional[str] = None
    status: str = "success"
    message: str


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    id: int
    timestamp: datetime
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True
