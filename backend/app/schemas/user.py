from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    uid: str
    name: str
    email: Optional[str] = None
    role: str = "user"
    authorized: bool = True


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
