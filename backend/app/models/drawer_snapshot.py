from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from app.database import Base


class DrawerSnapshot(Base):
    """A single image capture of a drawer interior.
    Snapshots are only taken when the drawer is fully closed and lighting is stable.
    baseline   — pre-session reference state
    post_close — image taken after user closes drawer (may be re-taken on retry)
    """

    __tablename__ = "drawer_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    drawer_id = Column(Integer, ForeignKey("drawers.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("drawer_sessions.id"), nullable=True, index=True)
    snapshot_type = Column(String, nullable=False)  # baseline | post_close | retry
    image_url = Column(String, nullable=False)
    captured_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    lighting_profile = Column(String, nullable=True)  # identifier for LED config used
    camera_profile = Column(String, nullable=True)    # focal length / resolution tag
    notes = Column(Text, nullable=True)

    def __repr__(self):
        return f"<DrawerSnapshot id={self.id} type={self.snapshot_type} drawer={self.drawer_id}>"
