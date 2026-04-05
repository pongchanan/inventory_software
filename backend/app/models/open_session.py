from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class OpenSession(Base):
    __tablename__ = "open_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    close_image_path: Mapped[str | None] = mapped_column(String, nullable=True)
    open_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    open_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    close_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
