from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String, nullable=False)  # User NFC UID
    item_uid = Column(String, nullable=False)  # Item RFID UID
    action = Column(String, default="borrow")  # borrow, return
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(String)

    def __repr__(self):
        return f"<Transaction {self.user_uid} -> {self.item_uid} ({self.action})>"
