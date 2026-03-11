from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from datetime import datetime
from app.database import Base


class DrawerSlot(Base):
    """A single cell in the acrylic grid of a Drawer.
    Each slot holds at most one item at a time (policy: 1 slot = 1 item).
    polygon_json stores the calibrated corner coordinates for image cropping.
    """

    __tablename__ = "drawer_slots"

    id = Column(Integer, primary_key=True, index=True)
    drawer_id = Column(Integer, ForeignKey("drawers.id"), nullable=False, index=True)
    slot_code = Column(String, nullable=False, index=True)  # e.g. "CAB1-D1-A3"
    row_index = Column(Integer, nullable=False)             # 0-based row in grid
    col_index = Column(Integer, nullable=False)             # 0-based col in grid
    polygon_json = Column(Text, nullable=True)              # JSON array of [x,y] corner points
    is_tracked = Column(Boolean, default=True)              # False = consumables / non-tracked bin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<DrawerSlot {self.slot_code} row={self.row_index} col={self.col_index}>"
