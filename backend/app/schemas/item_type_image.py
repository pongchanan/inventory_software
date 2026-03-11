from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ItemTypeImageBase(BaseModel):
    item_type_id: int
    image_url: str
    embedding_ref: Optional[str] = None
    is_primary: bool = False
    captured_view: Optional[str] = None


class ItemTypeImageCreate(ItemTypeImageBase):
    pass


class ItemTypeImageResponse(ItemTypeImageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
