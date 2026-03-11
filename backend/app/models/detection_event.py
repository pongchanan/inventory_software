from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from datetime import datetime
from app.database import Base


class DetectionEvent(Base):
    """Raw vision output for a single slot during a DrawerSession.
    Produced by the vision pipeline after comparing pre/post snapshots.
    change_type describes what the diff detected per slot.
    """

    __tablename__ = "detection_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("drawer_sessions.id"), nullable=False, index=True)
    slot_id = Column(Integer, ForeignKey("drawer_slots.id"), nullable=False, index=True)
    before_snapshot_id = Column(Integer, ForeignKey("drawer_snapshots.id"), nullable=True)
    after_snapshot_id = Column(Integer, ForeignKey("drawer_snapshots.id"), nullable=True)
    change_type = Column(String, nullable=False)
    # change_type values: added | removed | changed | unchanged
    predicted_item_type_id = Column(Integer, ForeignKey("item_types.id"), nullable=True)
    similarity_score = Column(Float, nullable=True)   # 0.0–1.0 top match score
    mask_area = Column(Float, nullable=True)           # pixel area of detected blob
    crop_image_url = Column(String, nullable=True)     # cropped slot image used for classification
    raw_predictions = Column(Text, nullable=True)      # JSON: top-k predictions with scores
    detected_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<DetectionEvent session={self.session_id} slot={self.slot_id} change={self.change_type} score={self.similarity_score}>"
