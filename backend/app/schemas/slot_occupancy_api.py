from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SlotOccupancyResponse(BaseModel):
    location_id: int
    state: str  # empty, occupied, unknown, error
    item_type_id: Optional[int]
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    last_event_id: Optional[int]
    updated_at: datetime

    class Config:
        from_attributes = True
