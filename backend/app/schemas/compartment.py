from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CompartmentBase(BaseModel):
    floor: int
    locker_number: str
    status: str = "available"


class CompartmentCreate(CompartmentBase):
    pass


class CompartmentUpdate(BaseModel):
    status: Optional[str] = None
    item_uid: Optional[str] = None
    user_uid: Optional[str] = None
    due_at: Optional[datetime] = None


class CompartmentResponse(CompartmentBase):
    id: int
    item_uid: Optional[str] = None
    user_uid: Optional[str] = None
    occupied_at: Optional[datetime] = None
    due_at: Optional[datetime] = None

    class Config:
        from_attributes = True
