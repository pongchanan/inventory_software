from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database import Base


class StorageUnit(Base):
    __tablename__ = "storage_units"

    id = Column(Integer, primary_key=True, index=True)
    unit_type = Column(String, nullable=False, index=True)  # drawer, shelf, hanger_cabinet
    layout_type = Column(String, nullable=False, index=True)  # grid, zone, none
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<StorageUnit id={self.id} type={self.unit_type} layout={self.layout_type}>"
