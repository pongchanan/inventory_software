from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DetectionEventBase(BaseModel):
    session_id: int
    slot_id: int
    before_snapshot_id: Optional[int] = None
    after_snapshot_id: Optional[int] = None
    change_type: str  # added | removed | changed | unchanged
    predicted_item_type_id: Optional[int] = None
    similarity_score: Optional[float] = None
    mask_area: Optional[float] = None
    crop_image_url: Optional[str] = None
    raw_predictions: Optional[str] = None  # JSON string


class DetectionEventCreate(DetectionEventBase):
    pass


class DetectionEventResponse(DetectionEventBase):
    id: int
    detected_at: datetime

    class Config:
        from_attributes = True
