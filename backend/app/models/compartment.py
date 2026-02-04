from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database import Base


class Compartment(Base):
    __tablename__ = "compartments"

    id = Column(Integer, primary_key=True, index=True)
    floor = Column(Integer, nullable=False)  # 1 or 2
    locker_number = Column(String, unique=True, nullable=False)
    status = Column(String, default="available")  # available, occupied, overdue, maintenance
    item_uid = Column(String, nullable=True)
    user_uid = Column(String, nullable=True)
    occupied_at = Column(DateTime, nullable=True)
    due_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Compartment {self.locker_number} ({self.status})>"
