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
from app.services.s3_storage import download_image

logger = logging.getLogger(__name__)


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


def _count_labels(db: Session, image_bytes: bytes, image_tag: str = "") -> Counter:
    # Lazy import avoids circular dependency (ai_service → borrowings_service)
    from app.services.ai_service import recognize_from_image

    logger.info(
        "[borrowings][count_labels] %s image size=%d bytes", image_tag, len(image_bytes)
    )
    hits = recognize_from_image(db, RecognizeFromImageInput(image_bytes=image_bytes))
    logger.info(
        "[borrowings][count_labels] %s total hits returned: %d", image_tag, len(hits)
    )

    counts: Counter = Counter()
    for i, hit in enumerate(hits):
        logger.info(
            "[borrowings][count_labels] %s hit[%d] label=%r score=%.4f margin=%.4f accepted=%s bbox=%s",
            image_tag,
            i,
            hit.label,
            hit.score,
            hit.margin,
            hit.accepted,
            hit.bbox,
        )
        if hit.accepted:
            counts[hit.label] += 1

    logger.info(
        "[borrowings][count_labels] %s accepted counts: %s", image_tag, dict(counts)
    )
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
    logger.info(
        "[borrowings][diff] ▶ START — session #%d current JPEG size=%d bytes",
        session_id,
        len(current_jpeg),
    )

    prev_key = _get_prev_close_image_key(db, session_id)
    if prev_key is None:
        logger.info(
            "[borrowings][diff] session #%d: no previous close image found — skipping diff",
            session_id,
        )
        return

    logger.info(
        "[borrowings][diff] session #%d: previous image S3 key=%s", session_id, prev_key
    )
    prev_bytes = _fetch_s3_bytes(prev_key)
    if prev_bytes is None:
        logger.warning(
            "[borrowings][diff] session #%d: cannot fetch previous image from S3 — skipping diff",
            session_id,
        )
        return

    logger.info(
        "[borrowings][diff] session #%d: previous image size=%d bytes",
        session_id,
        len(prev_bytes),
    )

    logger.info(
        "[borrowings][diff] session #%d: --- running recognition on PREVIOUS image ---",
        session_id,
    )
    prev_counts = _count_labels(db, prev_bytes, image_tag="PREV")

    logger.info(
        "[borrowings][diff] session #%d: --- running recognition on CURRENT image ---",
        session_id,
    )
    curr_counts = _count_labels(db, current_jpeg, image_tag="CURR")

    logger.info(
        "[borrowings][diff] session #%d: PREV counts: %s", session_id, dict(prev_counts)
    )
    logger.info(
        "[borrowings][diff] session #%d: CURR counts: %s", session_id, dict(curr_counts)
    )

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
    logger.info(
        "[borrowings][diff] session #%d: all labels seen: %s", session_id, all_labels
    )

    if not all_labels:
        logger.info(
            "[borrowings][diff] session #%d: no labels detected in either image — no changes",
            session_id,
        )
        return

    for label in all_labels:
        diff = prev_counts[label] - curr_counts[label]
        logger.info(
            "[borrowings][diff] label=%r prev=%d curr=%d diff=%+d",
            label,
            prev_counts[label],
            curr_counts[label],
            diff,
        )

        if diff == 0:
            logger.info("[borrowings][diff]   label=%r: no change", label)
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

        logger.info(
            "[borrowings][diff]   matched item id=%d name=%r qty=%d",
            item.id,
            item.name,
            item.quantity,
        )

        if diff > 0:
            # Items taken from cabinet
            logger.info("[borrowings][diff]   TAKEN x%d by user #%s", diff, user_id)
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
            logger.info(
                "[borrowings][diff]   created %d Borrowing row(s), new qty=%d",
                diff,
                item.quantity,
            )

        else:
            # Items returned to cabinet
            returned_count = -diff
            logger.info(
                "[borrowings][diff]   RETURNED x%d by user #%s", returned_count, user_id
            )
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
                    logger.info(
                        "[borrowings][diff]   closed borrowing id=%d, new qty=%d",
                        active_borrow.id,
                        item.quantity,
                    )
                else:
                    logger.warning(
                        "[borrowings][diff]   no active borrow for user #%s item=%r (return #%d) — skipping",
                        user_id,
                        label,
                        i + 1,
                    )

    db.commit()
    logger.info("[borrowings][diff] ✓ committed to DB — session #%d done", session_id)
