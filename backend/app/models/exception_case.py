from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from app.database import Base


class ExceptionCase(Base):
    """Tracks situations where the vision pipeline cannot confidently identify
    a slot change. The session is held open (or in attention_required state)
    until the exception is resolved by the user or an admin.
    """

    __tablename__ = "exception_cases"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("drawer_sessions.id"), nullable=False, index=True)
    slot_id = Column(Integer, ForeignKey("drawer_slots.id"), nullable=True)
    detection_event_id = Column(Integer, ForeignKey("detection_events.id"), nullable=True)
    exception_type = Column(String, nullable=False)
    # exception_type values:
    #   unknown_object      — similarity below threshold, no match found
    #   low_visibility      — object upside-down / partial view
    #   multi_object        — more than one item detected in a single slot
    #   capture_quality     — blur, over/under-exposure, missing snapshot
    #   calibration_error   — grid mapping invalid or stale
    severity = Column(String, default="warning")  # warning | critical
    status = Column(String, default="open")        # open | resolved | dismissed
    message = Column(Text, nullable=True)
    evidence_image_url = Column(String, nullable=True)
    resolved_by = Column(String, nullable=True)     # user_uid or "admin"
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ExceptionCase id={self.id} type={self.exception_type} status={self.status} session={self.session_id}>"
