import logging
import math
from collections import Counter
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.borrowing import Borrowing
from app.models.item import Item
from app.models.open_session import OpenSession
from app.schemas.ai_pipeline import RecognizeFromImageInput
from app.services.items_service import _first_image_for_items
from app.services.s3_storage import download_image, get_presigned_url

logger = logging.getLogger(__name__)


def _enrich_borrowings(db: Session, borrowings: list) -> list:
    """Attach item.image_url (presigned) to each borrowing's item."""
    item_ids = list({b.item_id for b in borrowings})
    sample_map = _first_image_for_items(db, item_ids)
    for b in borrowings:
        if b.item:
            key = sample_map.get(b.item_id)
            b.item.image_url = get_presigned_url(key) if key else None
    return borrowings


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
        "borrowings": _enrich_borrowings(db, borrowings),
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_all_borrowings_admin(db: Session, page: int, page_size: int) -> dict:
    """Get all borrowings with user info (admin view) - optimized single query"""
    from app.models.user import User

    query = db.query(Borrowing).join(User, Borrowing.user_id == User.id)

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))

    borrowings = (
        query.order_by(Borrowing.borrow_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "borrowings": _enrich_borrowings(db, borrowings),
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


# ---------------------------------------------------------------------------
# Close-image diff: detect taken / returned items and update borrowings
# ---------------------------------------------------------------------------

_DEFAULT_DUE_DAYS = 7


def _fetch_s3_bytes(key: str) -> bytes | None:
    try:
        return download_image(key)
    except Exception as exc:
        logger.warning("[borrowings] S3 fetch failed for key=%s: %s", key, exc)
        return None


def _count_labels(db: Session, image_bytes: bytes) -> Counter:
    # Lazy import avoids circular dependency (ai_service → borrowings_service)
    from app.services.ai_service import recognize_from_image

    hits = recognize_from_image(db, RecognizeFromImageInput(image_bytes=image_bytes))

    counts: Counter = Counter()
    for hit in hits:
        if hit.accepted:
            counts[hit.label] += 1

    return counts


def _get_prev_close_image_key(db: Session, current_session_id: int) -> str | None:
    prev = (
        db.query(OpenSession)
        .filter(
            OpenSession.id < current_session_id,
            OpenSession.close_image_path.isnot(None),
        )
        .order_by(OpenSession.id.desc())
        .first()
    )
    return prev.close_image_path if prev else None


def process_close_image_diff(db: Session, session_id: int, current_jpeg: bytes) -> None:
    """Compare the current close image against the previous session's close
    image and create/update Borrowing rows accordingly.

    - Items fewer than before  → new Borrowing rows (taken), quantity decremented
    - Items more than before   → close active Borrowing (returned), quantity incremented
    - Counts identical         → no-op (user just looked inside)
    - No previous session      → no baseline, skip silently
    """
    prev_key = _get_prev_close_image_key(db, session_id)
    if prev_key is None:
        return

    prev_bytes = _fetch_s3_bytes(prev_key)
    if prev_bytes is None:
        logger.warning(
            "[borrowings][diff] session #%d: cannot fetch previous image from S3 — skipping diff",
            session_id,
        )
        return

    prev_counts = _count_labels(db, prev_bytes)
    curr_counts = _count_labels(db, current_jpeg)

    session = db.query(OpenSession).filter(OpenSession.id == session_id).first()
    if not session:
        logger.warning(
            "[borrowings][diff] session #%d not found in DB — aborting", session_id
        )
        return

    user_id = session.open_by
    now = datetime.utcnow()
    due = now + timedelta(days=_DEFAULT_DUE_DAYS)

    all_labels = set(prev_counts) | set(curr_counts)

    if not all_labels:
        return

    for label in all_labels:
        diff = prev_counts[label] - curr_counts[label]

        if diff == 0:
            continue

        item = (
            db.query(Item)
            .filter(Item.name == label, Item.is_active == True)  # noqa: E712
            .first()
        )
        if not item:
            logger.warning(
                "[borrowings][diff]   label=%r has no matching active item — skipping",
                label,
            )
            continue

        if diff > 0:
            # Items taken from cabinet
            for _ in range(diff):
                db.add(
                    Borrowing(
                        user_id=user_id,
                        item_id=item.id,
                        borrow_at=now,
                        due_at=due,
                    )
                )
                item.quantity = max(0, item.quantity - 1)

        else:
            # Items returned to cabinet
            returned_count = -diff
            for i in range(returned_count):
                active_borrow = (
                    db.query(Borrowing)
                    .filter(
                        Borrowing.user_id == user_id,
                        Borrowing.item_id == item.id,
                        Borrowing.return_at == None,  # noqa: E711
                    )
                    .order_by(Borrowing.borrow_at.asc())
                    .first()
                )
                if active_borrow:
                    active_borrow.return_at = now
                    item.quantity += 1
                else:
                    logger.warning(
                        "[borrowings][diff]   no active borrow for user #%s item=%r (return #%d) — skipping",
                        user_id,
                        label,
                        i + 1,
                    )

    db.commit()
