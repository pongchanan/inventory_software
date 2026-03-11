from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String, nullable=False)  # User NFC UID
    item_uid = Column(String, nullable=False)  # Item RFID UID
    # Legacy-compatible action field now supports both old and new event types:
    # borrow | return | adjustment | unknown_change | manual_resolution
    action = Column(String, default="borrow")
    item_type_id = Column(Integer, nullable=True, index=True)
    quantity = Column(Integer, default=1)
    slot_id = Column(Integer, nullable=True, index=True)
    session_id = Column(Integer, nullable=True, index=True)
    detection_event_id = Column(Integer, nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(String)

    def __repr__(self):
        return (
            f"<Transaction user={self.user_uid} item_uid={self.item_uid} "
            f"item_type_id={self.item_type_id} qty={self.quantity} action={self.action}>"
        )
