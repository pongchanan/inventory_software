from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class RfidObservationDetail(Base):
    __tablename__ = "rfid_observation_details"

    observation_id = Column(Integer, ForeignKey("observations.id"), primary_key=True)
    tag_uid = Column(String, nullable=False, index=True)
    reader_id = Column(String, nullable=True)
    rssi = Column(Integer, nullable=True)
    read_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<RfidObservationDetail observation={self.observation_id} tag={self.tag_uid}>"
