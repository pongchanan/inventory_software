import math

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.borrowing import Borrowing
from app.models.item import Item


def get_user_borrowings(db: Session, user_id: int, page: int, page_size: int) -> dict:
    query = db.query(Borrowing).filter(
        Borrowing.user_id == user_id,
        Borrowing.return_at == None,  # noqa: E711
    )

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))

    borrowings = (
        query.order_by(Borrowing.borrow_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "borrowings": borrowings,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_popular_items(db: Session, page: int, page_size: int) -> dict:
    query = (
        db.query(
            Item.id,
            Item.name,
            Item.image_path,
            func.count(Borrowing.id).label("borrow_count"),
        )
        .join(Borrowing, Borrowing.item_id == Item.id)
        .group_by(Item.id)
        .order_by(func.count(Borrowing.id).desc())
    )

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))

    rows = query.offset((page - 1) * page_size).limit(page_size).all()

    items = [
        {
            "item_id": r.id,
            "name": r.name,
            "image_path": r.image_path,
            "borrow_count": r.borrow_count,
        }
        for r in rows
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
