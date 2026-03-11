from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class InventoryEventBase(BaseModel):
    session_id: Optional[int] = None
    user_uid: str
    event_type: str  # borrow | return | adjustment | manual_resolution
    item_type_id: int
    quantity: int = 1
    slot_id: Optional[int] = None
    detection_event_id: Optional[int] = None
    notes: Optional[str] = None


class InventoryEventCreate(InventoryEventBase):
    pass


class InventoryEventResponse(InventoryEventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
