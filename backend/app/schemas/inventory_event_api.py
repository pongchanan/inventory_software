from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class InventoryEventCreate(BaseModel):
    session_id: int
    user_id: int
    item_type_id: int
    event_type: str  # borrow, return, adjustment, manual_resolution
    quantity: int = 1
    location_id: Optional[int] = None
    observation_id: Optional[int] = None
    note: Optional[str] = None


class InventoryEventResponse(BaseModel):
    id: int
    session_id: int
    user_id: int
    item_type_id: int
    event_type: str
    quantity: int
    location_id: Optional[int]
    observation_id: Optional[int]
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
