from pydantic import BaseModel


class ItemOut(BaseModel):
    id: int
    name: str
    quantity: int
    is_active: bool
    image: str | None = None
    enroll_status: str | None = None
    sample_count: int = 0

    model_config = {"from_attributes": True}


class ItemEnrollOut(BaseModel):
    id: int
    name: str
    quantity: int
    is_active: bool
    image: str | None = None
    accepted_count: int
    rejected_count: int
    frames_sampled: int


class EnrollJobAccepted(BaseModel):
    """Returned immediately (HTTP 202) when an enrollment job is queued."""

    job_id: str
    status: str = "pending"
    item_id: int


class EnrollJobStatus(BaseModel):
    """Returned by the job-status polling endpoint."""

    job_id: str
    # pending | running | done | failed
    status: str
    item_id: int
    name: str | None = None
    quantity: int | None = None
    is_active: bool | None = None
    image: str | None = None
    accepted_count: int | None = None
    rejected_count: int | None = None
    frames_sampled: int | None = None
    error: str | None = None


class PaginatedItems(BaseModel):
    items: list[ItemOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class UpdateItemQuantityRequest(BaseModel):
    delta: int  # positive = add stock, negative = remove stock
