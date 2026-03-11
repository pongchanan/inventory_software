from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class StorageLocation(Base):
    __tablename__ = "storage_locations"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("storage_units.id"), nullable=False, index=True)
    level_no = Column(Integer, nullable=False)
    row_no = Column(Integer, nullable=True)  # nullable for zone layout
    col_no = Column(Integer, nullable=True)  # nullable for zone layout
    zone_code = Column(String, nullable=True)  # nullable for grid layout
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        if self.row_no is not None and self.col_no is not None:
            return f"<StorageLocation unit={self.unit_id} level={self.level_no} grid={self.row_no}x{self.col_no}>"
        else:
            return f"<StorageLocation unit={self.unit_id} level={self.level_no} zone={self.zone_code}>"
