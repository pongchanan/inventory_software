from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    nfc_card_uid: str
    name: str
    email: Optional[str] = None
    password: Optional[str] = None
    role: str = "user"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    nfc_card_uid: str
    name: str
    email: Optional[str]
    role: str
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
