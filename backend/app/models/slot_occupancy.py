from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class SlotOccupancy(Base):
    """The current occupancy state of a single DrawerSlot.
    Updated after every successfully processed DrawerSession.
    This is the canonical live map of what is in each slot.
    """

    __tablename__ = "slot_occupancies"

    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("drawer_slots.id"), nullable=False, index=True)
    snapshot_id = Column(Integer, ForeignKey("drawer_snapshots.id"), nullable=True)
    state = Column(String, nullable=False, default="unknown")
    # state values: empty | occupied | unknown | error
    item_type_id = Column(Integer, ForeignKey("item_types.id"), nullable=True)
    confidence = Column(Float, nullable=True)  # 0.0–1.0 from last classification
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<SlotOccupancy slot={self.slot_id} state={self.state} type={self.item_type_id}>"
