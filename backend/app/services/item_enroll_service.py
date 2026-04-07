from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.item import Item
from app.models.ai_label import AiLabel
from app.models.ai_sample import AiSample
from app.schemas.ai_pipeline import EnrollFromVideoInput
from app.services.ai_service import enroll_from_video


def create_item_record(db: Session, name: str, quantity: int) -> Item:
    """Create the Item row in the database and return it.

    This is the fast, synchronous part of enrollment — it completes before
    the background ML pipeline starts so the frontend can display the new
    item immediately.
    """
    item = Item(name=name.strip(), quantity=quantity, is_active=True)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def run_enroll_pipeline(
    db: Session,
    item_id: int,
    name: str,
    video_bytes: bytes,
) -> dict:
    """Run the slow AI enrollment pipeline for an already-created item.

    Intended to be called from a background thread with its own DB session.
    Returns a dict with accepted_count, rejected_count, frames_sampled, images.
    """
    payload = EnrollFromVideoInput(
        label=name.strip(),
        video_bytes=video_bytes,
        item_id=item_id,
    )
    enroll_result = enroll_from_video(db, payload)
    image_paths = _get_item_image_paths(db, item_id)

    return {
        "accepted_count": enroll_result.accepted_count,
        "rejected_count": enroll_result.rejected_count,
        "frames_sampled": enroll_result.frames_sampled,
        "images": image_paths,
    }


def _get_item_image_paths(db: Session, item_id: int) -> list[str]:
    rows = (
        db.query(AiSample.image_path)
        .join(AiLabel, AiLabel.id == AiSample.label_id)
        .filter(AiLabel.item_id == item_id)
        .order_by(AiSample.id)
        .all()
    )
    return [row.image_path for row in rows]
