from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from app.database import Base


class InventoryEvent(Base):
    __tablename__ = "inventory_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("access_sessions.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    item_type_id = Column(Integer, ForeignKey("item_types.id"), nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)  # borrow, return, adjustment, manual_resolution
    quantity = Column(Integer, default=1)
    location_id = Column(Integer, ForeignKey("storage_locations.id"), nullable=True)
    observation_id = Column(Integer, ForeignKey("observations.id"), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<InventoryEvent id={self.id} type={self.event_type} user={self.user_id} qty={self.quantity}>"
