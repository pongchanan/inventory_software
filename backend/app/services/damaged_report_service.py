import io
import uuid
from datetime import datetime

import openpyxl
from sqlalchemy.orm import Session

from app.models.borrowing import Borrowing
from app.models.damaged_item_report import DamagedItemReport
from app.models.item import Item
from app.models.user import User
from app.services.s3_storage import _get_bucket, _get_client, get_presigned_url


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _upload_damaged_image(data: bytes, user_id: int) -> str:
    """Upload damaged-report image to S3 and return the S3 key."""
    client = _get_client()
    bucket = _get_bucket()
    key = f"damaged-reports/user_{user_id}_{uuid.uuid4().hex[:8]}.jpg"
    client.put_object(Bucket=bucket, Key=key, Body=data, ContentType="image/jpeg")
    return key


def _resolve_active_item(db: Session, user_id: int) -> int:
    """Return item_id from the user's active (unreturned) borrowing.

    Raises ValueError if no active borrow exists.
    """
    borrowing = (
        db.query(Borrowing)
        .filter(Borrowing.user_id == user_id, Borrowing.return_at == None)  # noqa: E711
        .first()
    )
    if not borrowing:
        raise ValueError("You have no active borrowing to report as damaged")
    return borrowing.item_id


# ---------------------------------------------------------------------------
# Query functions
# ---------------------------------------------------------------------------


def get_all_reports(db: Session) -> list[DamagedItemReport]:
    return (
        db.query(DamagedItemReport).order_by(DamagedItemReport.report_at.desc()).all()
    )


def get_reports_by_user(db: Session, user_id: int) -> list[DamagedItemReport]:
    return (
        db.query(DamagedItemReport)
        .filter(DamagedItemReport.report_by == user_id)
        .order_by(DamagedItemReport.report_at.desc())
        .all()
    )


def get_report_image_url(db: Session, report_id: int) -> str:
    """Return a 30-minute presigned URL for a report's illustration image."""
    report = (
        db.query(DamagedItemReport).filter(DamagedItemReport.id == report_id).first()
    )
    if not report:
        raise ValueError(f"Report {report_id} not found")
    return get_presigned_url(report.illustrated_path)


# ---------------------------------------------------------------------------
# Create functions
# ---------------------------------------------------------------------------


def create_user_report(
    db: Session,
    user_id: int,
    topic: str,
    description: str,
    image_data: bytes,
) -> DamagedItemReport:
    """Create a damage report for the user's currently active borrow.

    Raises ValueError if the user has no active borrowing.
    """
    item_id = _resolve_active_item(db, user_id)
    image_key = _upload_damaged_image(image_data, user_id)

    report = DamagedItemReport(
        topic=topic,
        description=description,
        item_id=item_id,
        report_at=datetime.utcnow(),
        report_by=user_id,
        illustrated_path=image_key,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def create_admin_report(
    db: Session,
    admin_id: int,
    item_id: int,
    topic: str,
    description: str,
    image_data: bytes,
) -> DamagedItemReport:
    """Create a damage report for an explicit item and decrement its quantity by 1.

    Raises ValueError if the item is not found.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise ValueError(f"Item {item_id} not found")

    image_key = _upload_damaged_image(image_data, admin_id)

    report = DamagedItemReport(
        topic=topic,
        description=description,
        item_id=item_id,
        report_at=datetime.utcnow(),
        report_by=admin_id,
        illustrated_path=image_key,
    )
    db.add(report)

    if item.quantity > 0:
        item.quantity -= 1

    db.commit()
    db.refresh(report)
    return report


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------


def export_reports_excel(db: Session) -> bytes:
    """Return an Excel workbook (bytes) with all damaged item reports."""
    rows = (
        db.query(
            DamagedItemReport,
            Item.name.label("item_name"),
            User.name.label("reporter_name"),
        )
        .join(Item, Item.id == DamagedItemReport.item_id)
        .join(User, User.id == DamagedItemReport.report_by)
        .order_by(DamagedItemReport.report_at.desc())
        .all()
    )

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Damaged Item Reports"

    headers = [
        "ID",
        "Topic",
        "Description",
        "Item",
        "Reported By",
        "Reported At",
        "Image Key",
    ]
    ws.append(headers)

    for report, item_name, reporter_name in rows:
        ws.append(
            [
                report.id,
                report.topic,
                report.description,
                item_name,
                reporter_name,
                report.report_at.strftime("%Y-%m-%d %H:%M:%S"),
                report.illustrated_path,
            ]
        )

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()
