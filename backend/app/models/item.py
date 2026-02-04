from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from datetime import datetime
from app.database import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String, unique=True, index=True, nullable=False)  # RFID UID
    name = Column(String, nullable=False)
    description = Column(String)
    category = Column(String)
    quantity = Column(Integer, default=1)
    available = Column(Boolean, default=True)
    location = Column(String)  # Cabinet/shelf location
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Item {self.name} ({self.uid})>"
