from pydantic import BaseModel, model_validator
from datetime import datetime
from typing import Optional


class TransactionBase(BaseModel):
    user_uid: str
    item_uid: Optional[str] = None
    item_type_id: Optional[int] = None
    quantity: int = 1
    slot_id: Optional[int] = None
    session_id: Optional[int] = None
    detection_event_id: Optional[int] = None
    action: str = "borrow"
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_target(self):
        if not self.item_uid and self.item_type_id is None:
            raise ValueError("Either item_uid or item_type_id is required")
        if self.quantity < 1:
            raise ValueError("quantity must be >= 1")
        return self


class TransactionCreate(TransactionBase):
    pass


class TransactionResponse(TransactionBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True
