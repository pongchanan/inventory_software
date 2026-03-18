from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DrawerSlotBase(BaseModel):
    drawer_id: int
    slot_code: str
    row_index: int
    col_index: int
    polygon_json: Optional[str] = None
    is_tracked: bool = True
    is_active: bool = True


class DrawerSlotCreate(DrawerSlotBase):
    pass


class DrawerSlotUpdate(BaseModel):
    polygon_json: Optional[str] = None
    is_tracked: Optional[bool] = None
    is_active: Optional[bool] = None


class DrawerSlotResponse(DrawerSlotBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
