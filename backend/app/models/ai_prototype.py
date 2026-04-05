from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AiPrototype(Base):
    __tablename__ = "ai_prototypes"

    label_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("ai_labels.id", ondelete="CASCADE"),
        primary_key=True,
    )
    embedding_blob: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
