from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.database import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String, nullable=False)  # Requester
    item_uid = Column(String, nullable=False)  # Item requested
    requested_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")  # pending, approved, rejected
    priority = Column(String, default="normal")  # normal, high
    reason = Column(String)
    duration_days = Column(Integer, default=1)
    admin_uid = Column(String, nullable=True)  # Who approved/rejected
    resolved_at = Column(DateTime, nullable=True)
    admin_notes = Column(String, nullable=True)

    def __repr__(self):
        return f"<Approval {self.user_uid} -> {self.item_uid} ({self.status})>"
