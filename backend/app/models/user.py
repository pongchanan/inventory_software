from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    role: Mapped[str] = mapped_column(String, nullable=False, default="user")
    card_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    is_blacklist: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
