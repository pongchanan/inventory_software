import math

from sqlalchemy.orm import Session

from app.models.item import Item


def get_active_items(db: Session, page: int, page_size: int) -> dict:
    query = db.query(Item).filter(Item.is_active == True)  # noqa: E712

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))

    items = (
        query.order_by(Item.id).offset((page - 1) * page_size).limit(page_size).all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
