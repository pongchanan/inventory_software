from datetime import datetime

from pydantic import BaseModel


class UserBasic(BaseModel):
    """Basic user info for loan display"""

    id: int
    name: str
    email: str | None = None
    card_id: str | None = None

    model_config = {"from_attributes": True}


class ItemBasic(BaseModel):
    """Basic item info for loan display"""

    id: int
    name: str
    image_path: str | None = None
    image_url: str | None = None  # presigned URL for first sample image

    model_config = {"from_attributes": True}


class BorrowingOut(BaseModel):
    id: int
    item_id: int
    user_id: int
    borrow_at: datetime
    due_at: datetime
    return_at: datetime | None
    user: UserBasic | None = None
    item: ItemBasic | None = None

    model_config = {"from_attributes": True}


class PaginatedBorrowings(BaseModel):
    borrowings: list[BorrowingOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class PopularItemOut(BaseModel):
    item_id: int
    name: str
    image_path: str | None
    borrow_count: int


class PaginatedPopularItems(BaseModel):
    items: list[PopularItemOut]
    total: int
    page: int
    page_size: int
    total_pages: int
