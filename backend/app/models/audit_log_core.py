from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    ts = Column(DateTime, default=datetime.utcnow, index=True)
    actor_type = Column(String, nullable=False, index=True)  # user, system, device, admin
    actor_id = Column(String, nullable=True)
    action = Column(String, nullable=False, index=True)  # scan, unlock, lock, approve, sync, violation, login
    target_type = Column(String, nullable=True)
    target_id = Column(String, nullable=True)
    result = Column(String, nullable=True)  # success, failed
    ip_address = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    correlation_id = Column(String, nullable=True, index=True)

    def __repr__(self):
        return f"<AuditLog action={self.action} actor={self.actor_id} result={self.result}>"
