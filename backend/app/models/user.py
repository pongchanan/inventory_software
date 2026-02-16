from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String, unique=True, index=True, nullable=False)  # NFC/RFID UID
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="user")  # user, admin
    password_hash = Column(String, nullable=True)  # hashed password for login
    authorized = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.name} ({self.uid})>"
