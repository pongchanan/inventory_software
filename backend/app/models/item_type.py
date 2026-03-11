from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from app.database import Base


class ItemType(Base):
    """Represents a category/type of equipment (e.g. ESP32, NodeMCU, Arduino Nano).
    Used for loose tracking — we care about how many of each type exist,
    not individual serial numbers.
    """

    __tablename__ = "item_types"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)  # e.g. "ESP32_DEVKIT"
    name = Column(String, nullable=False)                           # e.g. "ESP32 DevKit V1"
    category = Column(String, nullable=True)                        # e.g. "Microcontroller"
    description = Column(Text, nullable=True)
    tracking_mode = Column(String, default="loose")                 # loose | bulk | non_tracked
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<ItemType {self.code} ({self.tracking_mode})>"
