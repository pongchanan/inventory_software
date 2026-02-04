from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ApprovalBase(BaseModel):
    user_uid: str
    item_uid: str
    reason: Optional[str] = None
    priority: str = "normal"
    duration_days: int = 1


class ApprovalCreate(ApprovalBase):
    pass


class ApprovalUpdate(BaseModel):
    status: str  # approved, rejected
    admin_notes: Optional[str] = None


class ApprovalResponse(ApprovalBase):
    id: int
    requested_at: datetime
    status: str
    admin_uid: Optional[str] = None
    resolved_at: Optional[datetime] = None
    admin_notes: Optional[str] = None

    class Config:
        from_attributes = True
