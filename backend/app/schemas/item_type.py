from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ItemTypeBase(BaseModel):
    code: str
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    tracking_mode: str = "loose"
    is_active: bool = True


class ItemTypeCreate(ItemTypeBase):
    pass


class ItemTypeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    tracking_mode: Optional[str] = None
    is_active: Optional[bool] = None


class ItemTypeResponse(ItemTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
