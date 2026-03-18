from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DrawerSnapshotBase(BaseModel):
    drawer_id: int
    session_id: Optional[int] = None
    snapshot_type: str  # baseline | post_close | retry
    image_url: str
    lighting_profile: Optional[str] = None
    camera_profile: Optional[str] = None
    notes: Optional[str] = None


class DrawerSnapshotCreate(DrawerSnapshotBase):
    pass


class DrawerSnapshotResponse(DrawerSnapshotBase):
    id: int
    captured_at: datetime

    class Config:
        from_attributes = True
