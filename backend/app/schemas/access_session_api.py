from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AccessSessionCreate(BaseModel):
    user_id: int
    unit_id: int


class AccessSessionClose(BaseModel):
    session_id: int


class AccessSessionResponse(BaseModel):
    id: int
    user_id: int
    unit_id: int
    opened_at: datetime
    closed_at: Optional[datetime]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
