from datetime import datetime

from pydantic import BaseModel


class BorrowingOut(BaseModel):
    id: int
    item_id: int
    user_id: int
    borrow_at: datetime
    due_at: datetime
    return_at: datetime | None

    model_config = {"from_attributes": True}


class PaginatedBorrowings(BaseModel):
    borrowings: list[BorrowingOut]
    total: int
    page: int
    page_size: int
    total_pages: int
