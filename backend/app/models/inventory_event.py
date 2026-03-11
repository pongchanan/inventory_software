from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class InventoryEvent(Base):
    """Business-level record of a borrow, return, or inventory adjustment.
    Translated from DetectionEvents by the inventory service.
    This is the source of truth for loan tracking in the new vision-based flow.
    """

    __tablename__ = "inventory_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("drawer_sessions.id"), nullable=True, index=True)
    user_uid = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=False)
    # event_type values: borrow | return | adjustment | manual_resolution
    item_type_id = Column(Integer, ForeignKey("item_types.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    slot_id = Column(Integer, ForeignKey("drawer_slots.id"), nullable=True)
    detection_event_id = Column(Integer, ForeignKey("detection_events.id"), nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<InventoryEvent {self.event_type} user={self.user_uid} type_id={self.item_type_id} qty={self.quantity}>"
