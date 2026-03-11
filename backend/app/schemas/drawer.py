from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DrawerBase(BaseModel):
    drawer_code: str
    cabinet_code: str
    floor: int
    camera_id: Optional[str] = None
    slot_rows: int = 4
    slot_cols: int = 6
    status: str = "active"
    is_active: bool = True


class DrawerCreate(DrawerBase):
    pass


class DrawerUpdate(BaseModel):
    camera_id: Optional[str] = None
    slot_rows: Optional[int] = None
    slot_cols: Optional[int] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


class DrawerResponse(DrawerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
