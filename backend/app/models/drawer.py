from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database import Base


class Drawer(Base):
    """A physical drawer inside a cabinet.
    Each drawer has its own top-down camera and LED strip.
    Slots within the drawer are tracked via DrawerSlot.
    """

    __tablename__ = "drawers"

    id = Column(Integer, primary_key=True, index=True)
    drawer_code = Column(String, unique=True, index=True, nullable=False)  # e.g. "CAB1-D1"
    cabinet_code = Column(String, nullable=False, index=True)              # e.g. "CAB1"
    floor = Column(Integer, nullable=False)                                # physical layer 1-N
    camera_id = Column(String, nullable=True)                              # identifier for the camera
    slot_rows = Column(Integer, nullable=False, default=4)
    slot_cols = Column(Integer, nullable=False, default=6)
    status = Column(String, default="active")  # active | maintenance | disabled
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Drawer {self.drawer_code} floor={self.floor} {self.slot_rows}x{self.slot_cols}>"
