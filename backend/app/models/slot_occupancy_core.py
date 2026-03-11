from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class SlotOccupancy(Base):
    __tablename__ = "slot_occupancies"

    location_id = Column(Integer, ForeignKey("storage_locations.id"), primary_key=True)
    state = Column(String, default="unknown", index=True)  # empty, occupied, unknown, error
    item_type_id = Column(Integer, ForeignKey("item_types.id"), nullable=True, index=True)
    confidence = Column(Float, nullable=True)  # 0.0 - 1.0
    last_event_id = Column(Integer, ForeignKey("inventory_events.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<SlotOccupancy location={self.location_id} state={self.state} item={self.item_type_id}>"
