import math

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.item import Item
from app.models.ai_label import AiLabel
from app.models.ai_sample import AiSample
from app.services.s3_storage import get_presigned_url, upload_item_image


def _first_image_for_items(db: Session, item_ids: list[int]) -> dict[int, str | None]:
    if not item_ids:
        return {}
    # One row per item: the AiSample with the lowest id for that item.
    subq = (
        db.query(func.min(AiSample.id).label("sample_id"))
        .join(AiLabel, AiLabel.id == AiSample.label_id)
        .filter(AiLabel.item_id.in_(item_ids))
        .group_by(AiLabel.item_id)
        .subquery()
    )
    rows = (
        db.query(AiLabel.item_id, AiSample.image_path)
        .join(AiLabel, AiLabel.id == AiSample.label_id)
        .filter(AiSample.id.in_(subq))
        .all()
    )
    result: dict[int, str | None] = {iid: None for iid in item_ids}
    for row in rows:
        result[row.item_id] = row.image_path
    return result


def item_to_out(item: Item) -> dict:
    """Convert an Item ORM object to a dict compatible with ``ItemOut``.

    Resolves ``image_path`` → presigned URL so the frontend can use it
    directly as an ``<img src>``.
    """
    return {
        "id": item.id,
        "name": item.name,
        "quantity": item.quantity,
        "is_active": item.is_active,
        "image": get_presigned_url(item.image_path) if item.image_path else None,
        "enroll_status": item.enroll_status,
    }


def update_item_quantity(db: Session, item_id: int, delta: int) -> dict:
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise ValueError(f"Item {item_id} not found")
    new_qty = item.quantity + delta
    if new_qty < 0:
        raise ValueError(f"Cannot remove {abs(delta)} — only {item.quantity} in stock")
    item.quantity = new_qty
    db.commit()
    db.refresh(item)
    return item_to_out(item)


def update_item_image(
    db: Session,
    item_id: int,
    image_bytes: bytes,
    content_type: str = "image/jpeg",
) -> dict:
    """Upload a new cover image for *item_id* to S3 and persist the S3 key.

    Returns an ``ItemOut``-compatible dict with a live presigned URL.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise ValueError(f"Item {item_id} not found")
    key = upload_item_image(image_bytes, item_id, content_type)
    item.image_path = key
    db.commit()
    db.refresh(item)
    return item_to_out(item)


def get_active_items(db: Session, page: int, page_size: int) -> dict:
    query = db.query(Item).filter(Item.is_active == True)  # noqa: E712

    # Use scalar count — avoids the extra subquery that legacy .count() generates.
    total = db.query(func.count(Item.id)).filter(Item.is_active == True).scalar()  # noqa: E712
    total_pages = max(1, math.ceil(total / page_size))

    items = (
        query.order_by(Item.id).offset((page - 1) * page_size).limit(page_size).all()
    )

    # For items that don't yet have image_path set (legacy rows), fall back to
    # the first accepted AiSample frame.
    items_without_path = [i for i in items if not i.image_path]
    sample_image_map = _first_image_for_items(db, [i.id for i in items_without_path])

    items_out = []
    for item in items:
        if item.image_path:
            raw_key: str | None = item.image_path
        else:
            raw_key = sample_image_map.get(item.id)
        items_out.append(
            {
                "id": item.id,
                "name": item.name,
                "quantity": item.quantity,
                "is_active": item.is_active,
                "image": get_presigned_url(raw_key) if raw_key else None,
                "enroll_status": item.enroll_status,
            }
        )

    return {
        "items": items_out,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
