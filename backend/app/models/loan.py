from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from datetime import datetime
from app.database import Base


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String, nullable=False, index=True)  # User NFC UID
    item_uid = Column(String, nullable=False, index=True)  # Item RFID UID
    borrowed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    due_at = Column(DateTime, nullable=False)
    returned_at = Column(DateTime, nullable=True)
    status = Column(String, default="active")  # active, returned, overdue
    
    def __repr__(self):
        return f"<Loan {self.user_uid} borrowed {self.item_uid}>"
