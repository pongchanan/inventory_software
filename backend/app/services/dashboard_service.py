import math
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.borrowing import Borrowing
from app.models.damaged_item_report import DamagedItemReport
from app.models.item import Item
from app.services.s3_storage import get_presigned_url
from app.services.items_service import _first_image_for_items


def get_dashboard_stats(db: Session) -> dict:
    """Return aggregate counts for the admin dashboard."""
    now = datetime.utcnow()

    total_items = db.query(func.count(Item.id)).filter(Item.is_active == True).scalar() or 0  # noqa: E712
    total_quantity = db.query(func.coalesce(func.sum(Item.quantity), 0)).filter(Item.is_active == True).scalar()  # noqa: E712

    active_borrows = (
        db.query(func.count(Borrowing.id))
        .filter(Borrowing.return_at == None)  # noqa: E711
        .scalar()
        or 0
    )

    overdue_borrows = (
        db.query(func.count(Borrowing.id))
        .filter(Borrowing.return_at == None, Borrowing.due_at <= now)  # noqa: E711
        .scalar()
        or 0
    )

    total_reports = db.query(func.count(DamagedItemReport.id)).scalar() or 0

    return {
        "total_items": total_items,
        "total_quantity": total_quantity,
        "active_borrows": active_borrows,
        "overdue_borrows": overdue_borrows,
        "total_damage_reports": total_reports,
    }


def get_most_damaged_items(db: Session, limit: int = 5) -> list[dict]:
    """Return items with the most damage reports."""
    rows = (
        db.query(
            DamagedItemReport.item_id,
            Item.name,
            Item.image_path,
            func.count(DamagedItemReport.id).label("report_count"),
        )
        .join(Item, DamagedItemReport.item_id == Item.id)
        .group_by(DamagedItemReport.item_id, Item.name, Item.image_path)
        .order_by(func.count(DamagedItemReport.id).desc())
        .limit(limit)
        .all()
    )

    item_ids = [r.item_id for r in rows]
    sample_map = _first_image_for_items(db, item_ids)

    result = []
    for r in rows:
        key = r.image_path or sample_map.get(r.item_id)
        result.append({
            "item_id": r.item_id,
            "name": r.name,
            "image": get_presigned_url(key) if key else None,
            "report_count": r.report_count,
        })
    return result
