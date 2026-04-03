from datetime import datetime

from pydantic import BaseModel

from app.schemas.auth import UserOut


class OpenSessionOut(BaseModel):
    id: int
    open_by: int
    open_at: datetime
    close_at: datetime | None
    close_image_path: str | None
    user: UserOut

    model_config = {"from_attributes": True}


class PaginatedSessions(BaseModel):
    sessions: list[OpenSessionOut]
    total: int
    page: int
    page_size: int
    total_pages: int
