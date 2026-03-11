from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DrawerSessionBase(BaseModel):
    drawer_id: int
    user_uid: str


class DrawerSessionCreate(DrawerSessionBase):
    baseline_snapshot_id: Optional[int] = None


class DrawerSessionUpdate(BaseModel):
    status: Optional[str] = None
    closed_at: Optional[datetime] = None
    close_attempt_count: Optional[int] = None
    baseline_snapshot_id: Optional[int] = None


class DrawerSessionResponse(DrawerSessionBase):
    id: int
    started_at: datetime
    closed_at: Optional[datetime]
    status: str
    close_attempt_count: int
    baseline_snapshot_id: Optional[int]

    class Config:
        from_attributes = True
