from datetime import datetime

from pydantic import BaseModel


class DamagedItemReportOut(BaseModel):
    id: int
    topic: str
    description: str
    item_id: int
    report_at: datetime
    report_by: int
    illustrated_path: str
    approved: bool
    admin_comment: str | None

    model_config = {"from_attributes": True}


class ApproveReportRequest(BaseModel):
    admin_comment: str | None = None


class DamagedItemReportCreate(BaseModel):
    """Used by a regular user — item_id is auto-resolved from active borrow."""

    topic: str
    description: str


class DamagedItemReportAdminCreate(BaseModel):
    """Used by admin — must supply item_id explicitly."""

    topic: str
    description: str
    item_id: int
