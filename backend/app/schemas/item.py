from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ItemBase(BaseModel):
    uid: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: int = 1
    available: bool = True
    location: Optional[str] = None
    image_url: Optional[str] = None


class ItemCreate(ItemBase):
    pass


class ItemResponse(ItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
