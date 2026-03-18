from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from datetime import datetime
from app.database import Base


class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("access_sessions.id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("storage_locations.id"), nullable=True, index=True)
    source_type = Column(String, nullable=False, index=True)  # rfid, vision
    change_type = Column(String, nullable=False)  # added, removed, changed, unchanged, unknown
    confidence = Column(Float, nullable=True)  # 0.0 - 1.0
    review_status = Column(String, default="normal", index=True)  # normal, needs_review, resolved
    review_note = Column(Text, nullable=True)
    observed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Observation id={self.id} session={self.session_id} source={self.source_type} change={self.change_type}>"
