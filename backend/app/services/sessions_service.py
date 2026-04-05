import math
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.open_session import OpenSession
from app.models.user import User
from app.services.s3_storage import get_presigned_url, upload_image


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


def close_session_with_image(db: Session, session_id: int, jpeg_data: bytes) -> None:
    """Upload JPEG to S3 and mark the session as closed.

    Raises ValueError if the session is not found or already closed.
    """
    session = db.query(OpenSession).filter(OpenSession.id == session_id).first()
    if not session:
        raise ValueError(f"Session {session_id} not found")
    if session.close_at is not None:
        raise ValueError(f"Session {session_id} already closed")

    try:
        image_key = upload_image(jpeg_data, session_id)
    except Exception as exc:
        print(f"[sessions-service] S3 upload failed: {exc}")
        image_key = None

    session.close_image_path = image_key
    session.close_at = datetime.utcnow()
    db.commit()
    print(f"[sessions-service] Session #{session_id} closed, image: {image_key}")


def get_session_image_url(db: Session, session_id: int) -> str:
    """Return a 30-minute presigned URL for the session's close image.

    Raises ValueError if the session or image is not found.
    """
    session = db.query(OpenSession).filter(OpenSession.id == session_id).first()
    if not session:
        raise ValueError(f"Session {session_id} not found")
    if not session.close_image_path:
        raise ValueError(f"Session {session_id} has no image")
    return get_presigned_url(session.close_image_path)


def get_session_images(db: Session, page: int, page_size: int) -> dict:
    query = db.query(OpenSession).filter(OpenSession.close_image_path.isnot(None))

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))

    rows = (
        query.order_by(OpenSession.close_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    images = []
    for session in rows:
        try:
            url = get_presigned_url(session.close_image_path)
        except Exception:
            url = ""
        images.append(
            {
                "session_id": session.id,
                "open_at": session.open_at,
                "close_at": session.close_at,
                "url": url,
            }
        )

    return {
        "images": images,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
