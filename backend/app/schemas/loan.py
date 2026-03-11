from pydantic import BaseModel, model_validator
from datetime import datetime
from typing import Optional


class LoanBase(BaseModel):
    user_uid: str
    item_uid: Optional[str] = None
    item_type_id: Optional[int] = None
    quantity: int = 1
    slot_id: Optional[int] = None
    source_action: str = "borrow"
    due_at: Optional[datetime] = None

    @model_validator(mode="after")
    def validate_target(self):
        if not self.item_uid and self.item_type_id is None:
            raise ValueError("Either item_uid or item_type_id is required")
        if self.quantity < 1:
            raise ValueError("quantity must be >= 1")
        return self
    

class LoanCreate(LoanBase):
    pass


class LoanResponse(LoanBase):
    id: int
    borrowed_at: datetime
    returned_at: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True
