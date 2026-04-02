import math

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.borrowing import Borrowing


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
