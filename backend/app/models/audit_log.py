from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    type = Column(String, nullable=False)  # scan, unlock, lock, sync, approval, violation
    user = Column(String, nullable=False)
    item = Column(String, nullable=True)
    status = Column(String, default="success")  # success, failed
    message = Column(String)
    ip_address = Column(String, nullable=True)
    
    def __repr__(self):
        return f"<AuditLog {self.type} by {self.user}>"
