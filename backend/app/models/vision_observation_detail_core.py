from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from datetime import datetime
from app.database import Base


class VisionObservationDetail(Base):
    __tablename__ = "vision_observation_details"

    observation_id = Column(Integer, ForeignKey("observations.id"), primary_key=True)
    before_image_url = Column(String, nullable=True)
    after_image_url = Column(String, nullable=True)
    crop_url = Column(String, nullable=True)
    model_version = Column(String, nullable=True)
    raw_predictions_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<VisionObservationDetail observation={self.observation_id}>"
