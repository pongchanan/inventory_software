import math

from sqlalchemy.orm import Session

from app.models.item import Item
from app.models.ai_label import AiLabel
from app.models.ai_sample import AiSample


def _first_image_for_items(db: Session, item_ids: list[int]) -> dict[int, str | None]:
    if not item_ids:
        return {}
    # Get the first sample image path per item (lowest AiSample.id)
    rows = (
        db.query(AiLabel.item_id, AiSample.image_path)
        .join(AiSample, AiSample.label_id == AiLabel.id)
        .filter(AiLabel.item_id.in_(item_ids))
        .order_by(AiLabel.item_id, AiSample.id)
        .all()
    )
    result: dict[int, str | None] = {iid: None for iid in item_ids}
    for row in rows:
        if result[row.item_id] is None:  # keep only the first
            result[row.item_id] = row.image_path
    return result


def update_item_quantity(db: Session, item_id: int, delta: int) -> Item:
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise ValueError(f"Item {item_id} not found")
    new_qty = item.quantity + delta
    if new_qty < 0:
        raise ValueError(f"Cannot remove {abs(delta)} — only {item.quantity} in stock")
    item.quantity = new_qty
    db.commit()
    db.refresh(item)
    return item


def get_active_items(db: Session, page: int, page_size: int) -> dict:
    query = db.query(Item).filter(Item.is_active == True)  # noqa: E712

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))

    items = (
        query.order_by(Item.id).offset((page - 1) * page_size).limit(page_size).all()
    )

    image_map = _first_image_for_items(db, [item.id for item in items])

    items_out = []
    for item in items:
        items_out.append(
            {
                "id": item.id,
                "name": item.name,
                "quantity": item.quantity,
                "is_active": item.is_active,
                "image": image_map.get(item.id),
            }
        )

    return {
        "items": items_out,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
