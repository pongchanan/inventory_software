from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class LoanBase(BaseModel):
    user_uid: str
    item_uid: str
    due_at: datetime
    

class LoanCreate(LoanBase):
    pass


class LoanResponse(LoanBase):
    id: int
    borrowed_at: datetime
    returned_at: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True
