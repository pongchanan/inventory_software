from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.item import Item
from app.models.ai_label import AiLabel
from app.models.ai_sample import AiSample
from app.schemas.ai_pipeline import EnrollFromVideoInput
from app.services.ai_service import enroll_from_video
from app.services.s3_storage import upload_item_image


def add_quantity_to_existing(
    db: Session,
    item_id: int,
    extra_quantity: int,
    image_bytes: bytes | None = None,
    image_content_type: str = "image/jpeg",
) -> Item | None:
    """Add *extra_quantity* to an existing item.

    Optionally replaces the cover image if *image_bytes* is given.
    Returns the updated Item, or ``None`` if the item doesn't exist.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if item is None:
        return None

    item.quantity += extra_quantity
    db.commit()
    db.refresh(item)

    if image_bytes:
        key = upload_item_image(image_bytes, item.id, image_content_type)
        item.image_path = key
        db.commit()
        db.refresh(item)

    return item


def create_item_record(
    db: Session,
    name: str,
    quantity: int,
    image_bytes: bytes | None = None,
    image_content_type: str = "image/jpeg",
) -> Item:
    """Create the Item row in the database and return it.

    This is the fast, synchronous part of enrollment — it completes before
    the background ML pipeline starts so the frontend can display the new
    item immediately.  ``enroll_status`` is set to ``"processing"`` so that
    a server crash can be detected on the next startup.

    If *image_bytes* is provided the image is uploaded to S3 immediately and
    ``item.image_path`` is set before returning.  Otherwise ``image_path``
    stays ``None`` until the ML pipeline picks the best frame.
    """
    item = Item(
        name=name.strip(), quantity=quantity, is_active=True, enroll_status="processing"
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    if image_bytes:
        key = upload_item_image(image_bytes, item.id, image_content_type)
        item.image_path = key
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
