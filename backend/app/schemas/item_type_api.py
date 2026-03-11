from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ItemTypeCreate(BaseModel):
    name: str


class ItemTypeUpdate(BaseModel):
    name: Optional[str] = None
    active: Optional[bool] = None


class ItemTypeImageCreate(BaseModel):
    image_url: str
    is_primary: bool = False


class ItemTypeImageResponse(BaseModel):
    id: int
    item_type_id: int
    image_url: str
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ItemTypeResponse(BaseModel):
    id: int
    name: str
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ItemTypeDetailResponse(ItemTypeResponse):
    images: List[ItemTypeImageResponse] = []
