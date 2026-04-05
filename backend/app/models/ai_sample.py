from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AiSample(Base):
    __tablename__ = "ai_samples"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    label_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("ai_labels.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_path: Mapped[str] = mapped_column(String, nullable=False)
    embedding_blob: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    image_hash: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    bbox_json: Mapped[str | None] = mapped_column(String, nullable=True)
    quality_blur: Mapped[float | None] = mapped_column(Float, nullable=True)
    quality_brightness: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
