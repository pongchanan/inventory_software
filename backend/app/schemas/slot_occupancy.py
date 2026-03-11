from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SlotOccupancyBase(BaseModel):
    slot_id: int
    snapshot_id: Optional[int] = None
    state: str = "unknown"  # empty | occupied | unknown | error
    item_type_id: Optional[int] = None
    confidence: Optional[float] = None


class SlotOccupancyCreate(SlotOccupancyBase):
    pass


class SlotOccupancyUpdate(BaseModel):
    snapshot_id: Optional[int] = None
    state: Optional[str] = None
    item_type_id: Optional[int] = None
    confidence: Optional[float] = None


class SlotOccupancyResponse(SlotOccupancyBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True
