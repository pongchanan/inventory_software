import math

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.item import Item
from app.models.ai_label import AiLabel
from app.models.ai_sample import AiSample
from app.services.s3_storage import get_presigned_url, upload_item_image


def _sample_counts_for_items(db: Session, item_ids: list[int]) -> dict[int, int]:
    """Return {item_id: count} of AiSample rows for each item."""
    if not item_ids:
        return {}
    rows = (
        db.query(AiLabel.item_id, func.count(AiSample.id))
        .join(AiLabel, AiLabel.id == AiSample.label_id)
        .filter(AiLabel.item_id.in_(item_ids))
        .group_by(AiLabel.item_id)
        .all()
    )
    result = {iid: 0 for iid in item_ids}
    for item_id, cnt in rows:
        result[item_id] = cnt
    return result


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


def item_to_out(item: Item, sample_count: int = 0) -> dict:
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
        "sample_count": sample_count,
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


def get_active_items(
    db: Session, page: int, page_size: int, search: str | None = None
) -> dict:
    base_filter = [Item.is_active == True]  # noqa: E712
    if search:
        base_filter.append(Item.name.ilike(f"%{search}%"))
    query = db.query(Item).filter(*base_filter)

    # Use scalar count — avoids the extra subquery that legacy .count() generates.
    total = db.query(func.count(Item.id)).filter(*base_filter).scalar()
    total_pages = max(1, math.ceil(total / page_size))

    items = (
        query.order_by(Item.id).offset((page - 1) * page_size).limit(page_size).all()
    )

    # For items that don't yet have image_path set (legacy rows), fall back to
    # the first accepted AiSample frame.
    items_without_path = [i for i in items if not i.image_path]
    sample_image_map = _first_image_for_items(db, [i.id for i in items_without_path])
    sample_counts = _sample_counts_for_items(db, [i.id for i in items])

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
                "sample_count": sample_counts.get(item.id, 0),
            }
        )

    return {
        "items": items_out,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_admin_items(
    db: Session,
    page: int,
    page_size: int,
    search: str | None = None,
    is_active: bool | None = None,
) -> dict:
    """Admin variant — returns ALL items, optionally filtered by is_active."""
    base_filter = []
    if is_active is not None:
        base_filter.append(Item.is_active == is_active)  # noqa: E712
    if search:
        base_filter.append(Item.name.ilike(f"%{search}%"))

    total = db.query(func.count(Item.id)).filter(*base_filter).scalar()
    total_pages = max(1, math.ceil(total / page_size))

    items = (
        db.query(Item)
        .filter(*base_filter)
        .order_by(Item.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items_without_path = [i for i in items if not i.image_path]
    sample_image_map = _first_image_for_items(db, [i.id for i in items_without_path])
    sample_counts = _sample_counts_for_items(db, [i.id for i in items])

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
                "sample_count": sample_counts.get(item.id, 0),
            }
        )

    return {
        "items": items_out,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def toggle_item_active(db: Session, item_id: int) -> dict:
    """Toggle is_active for an item and return updated ItemOut."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise ValueError(f"Item {item_id} not found")
    item.is_active = not item.is_active
    db.commit()
    db.refresh(item)
    sc = _sample_counts_for_items(db, [item.id])
    return item_to_out(item, sample_count=sc.get(item.id, 0))
