from datetime import datetime

from pydantic import BaseModel


class UserBasic(BaseModel):
    id: int
    name: str
    email: str | None = None
    card_id: str | None = None

    model_config = {"from_attributes": True}


class ItemBasic(BaseModel):
    id: int
    name: str
    image_path: str | None = None
    image_url: str | None = None  # presigned URL for first sample image

    model_config = {"from_attributes": True}


class DamagedItemReportOut(BaseModel):
    id: int
    topic: str
    description: str
    item_id: int
    item: ItemBasic | None = None
    report_at: datetime
    report_by: int
    user: UserBasic | None = None
    illustrated_path: str
    illustrated_url: str | None = None  # presigned URL for the illustration image
    approved: bool
    approved_by: int | None
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
