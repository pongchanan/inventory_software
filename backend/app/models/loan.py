from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String, nullable=False, index=True)  # User NFC UID
    item_uid = Column(String, nullable=False, index=True)  # Item RFID UID
    item_type_id = Column(Integer, nullable=True, index=True)
    quantity = Column(Integer, default=1)
    slot_id = Column(Integer, nullable=True, index=True)
    # Captures the source concept for vision-based flow while keeping legacy loan statuses.
    # borrow | return | adjustment | unknown_change | manual_resolution
    source_action = Column(String, default="borrow")
    borrowed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    due_at = Column(DateTime, nullable=True)
    returned_at = Column(DateTime, nullable=True)
    status = Column(String, default="active")  # active, returned, overdue
    
    def __repr__(self):
        return (
            f"<Loan user={self.user_uid} item_uid={self.item_uid} "
            f"item_type_id={self.item_type_id} qty={self.quantity} status={self.status}>"
        )
