from pydantic import BaseModel


class ItemOut(BaseModel):
    id: int
    name: str
    quantity: int
    is_active: bool
    image: str | None = None

    model_config = {"from_attributes": True}


class PaginatedItems(BaseModel):
    items: list[ItemOut]
    total: int
    page: int
    page_size: int
    total_pages: int
