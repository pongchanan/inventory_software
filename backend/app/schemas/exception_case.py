from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ExceptionCaseBase(BaseModel):
    session_id: int
    slot_id: Optional[int] = None
    detection_event_id: Optional[int] = None
    exception_type: str
    # unknown_object | low_visibility | multi_object | capture_quality | calibration_error
    severity: str = "warning"  # warning | critical
    status: str = "open"       # open | resolved | dismissed
    message: Optional[str] = None
    evidence_image_url: Optional[str] = None


class ExceptionCaseCreate(ExceptionCaseBase):
    pass


class ExceptionCaseResolve(BaseModel):
    status: str  # resolved | dismissed
    resolved_by: str


class ExceptionCaseResponse(ExceptionCaseBase):
    id: int
    resolved_by: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
