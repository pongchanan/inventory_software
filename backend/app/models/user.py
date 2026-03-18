from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import synonym
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nfc_card_uid = Column(String, unique=True, index=True, nullable=False)
    uid = synonym("nfc_card_uid")
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="user")  # user, admin
    password_hash = Column(String, nullable=True)  # hashed password for login
    active = Column(Boolean, default=True)
    authorized = synonym("active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.name} ({self.nfc_card_uid})>"
