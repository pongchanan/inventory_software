from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class ItemTypeImage(Base):
    __tablename__ = "item_type_images"

    id = Column(Integer, primary_key=True, index=True)
    item_type_id = Column(Integer, ForeignKey("item_types.id"), nullable=False, index=True)
    image_url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ItemTypeImage type_id={self.item_type_id} primary={self.is_primary}>"
