from pydantic import BaseModel


class ItemOut(BaseModel):
    id: int
    name: str
    image_path: str | None
    quantity: int
    is_active: bool

    model_config = {"from_attributes": True}


class PaginatedItems(BaseModel):
    items: list[ItemOut]
    total: int
    page: int
    page_size: int
    total_pages: int
