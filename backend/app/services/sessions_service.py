import math

from sqlalchemy.orm import Session

from app.models.open_session import OpenSession
from app.models.user import User


def get_sessions(db: Session, page: int, page_size: int) -> dict:
    query = db.query(OpenSession, User).join(User, OpenSession.open_by == User.id)

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))

    rows = (
        query.order_by(OpenSession.open_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    sessions = []
    for session, user in rows:
        session.user = user
        sessions.append(session)

    return {
        "sessions": sessions,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
