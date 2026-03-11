from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from datetime import datetime
from app.database import Base


class ItemTypeImage(Base):
    """Reference images for a given ItemType used by the similarity search pipeline.
    Multiple images per type improve classification accuracy.
    """

    __tablename__ = "item_type_images"

    id = Column(Integer, primary_key=True, index=True)
    item_type_id = Column(Integer, ForeignKey("item_types.id"), nullable=False, index=True)
    image_url = Column(String, nullable=False)
    embedding_ref = Column(Text, nullable=True)    # path / vector store key for pre-computed embedding
    is_primary = Column(Boolean, default=False)    # flag one image as the canonical preview
    captured_view = Column(String, nullable=True)  # e.g. "top", "front", "angle"
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ItemTypeImage type_id={self.item_type_id} primary={self.is_primary}>"
