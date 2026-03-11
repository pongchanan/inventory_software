from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class DrawerSession(Base):
    """Records one user's interaction with a drawer from card-tap to final close.
    A session is considered complete only after the vision pipeline confirms
    all slot changes with acceptable confidence.
    """

    __tablename__ = "drawer_sessions"

    id = Column(Integer, primary_key=True, index=True)
    drawer_id = Column(Integer, ForeignKey("drawers.id"), nullable=False, index=True)
    user_uid = Column(String, nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    closed_at = Column(DateTime, nullable=True)
    status = Column(
        String,
        default="open",
    )
    # status values:
    #   open               — drawer is currently unlocked / in use
    #   processing         — drawer closed, vision pipeline running
    #   completed          — all changes resolved, inventory updated
    #   attention_required — low-confidence detections, waiting for user fix
    #   manual_review      — admin must resolve before session closes
    #   abandoned          — timed out without close
    close_attempt_count = Column(Integer, default=0)  # how many retries needed
    baseline_snapshot_id = Column(Integer, nullable=True)  # snapshot used as pre-state

    def __repr__(self):
        return f"<DrawerSession id={self.id} drawer={self.drawer_id} user={self.user_uid} status={self.status}>"
