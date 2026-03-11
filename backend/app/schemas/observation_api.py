from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional


class ObservationCreate(BaseModel):
    session_id: int
    location_id: Optional[int] = None
    source_type: str  # rfid, vision
    change_type: str  # added, removed, changed, unchanged, unknown
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)


class ObservationUpdate(BaseModel):
    review_status: Optional[str] = None
    review_note: Optional[str] = None


class RfidObservationDetailCreate(BaseModel):
    observation_id: int
    tag_uid: str
    reader_id: Optional[str] = None
    rssi: Optional[int] = None
    read_count: int = 1


class RfidObservationDetailResponse(BaseModel):
    observation_id: int
    tag_uid: str
    reader_id: Optional[str]
    rssi: Optional[int]
    read_count: int

    class Config:
        from_attributes = True


class VisionObservationDetailCreate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    observation_id: int
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    crop_url: Optional[str] = None
    model_version: Optional[str] = None
    raw_predictions_json: Optional[dict] = None


class VisionObservationDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    observation_id: int
    before_image_url: Optional[str]
    after_image_url: Optional[str]
    crop_url: Optional[str]
    model_version: Optional[str]
    raw_predictions_json: Optional[dict]


class ObservationResponse(BaseModel):
    id: int
    session_id: int
    location_id: Optional[int]
    source_type: str
    change_type: str
    confidence: Optional[float]
    review_status: str
    review_note: Optional[str]
    observed_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
