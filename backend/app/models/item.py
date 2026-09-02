from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    locker_number: Mapped[str | None] = mapped_column(String(3), nullable=True, index=True)
    image_path: Mapped[str | None] = mapped_column(String, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Tracks the async enrollment pipeline state.
    # None        → regular item (not created via video enrollment)
    # "processing" → item created, ML pipeline in progress
    # "done"       → ML pipeline completed successfully
    # "failed"     → pipeline failed or server crashed mid-job (video must be re-uploaded)
    enroll_status: Mapped[str | None] = mapped_column(
        String, nullable=True, default=None
    )
