from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TransactionBase(BaseModel):
    user_uid: str
    item_uid: str
    action: str = "borrow"
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionResponse(TransactionBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
