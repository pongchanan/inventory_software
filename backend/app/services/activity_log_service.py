from sqlalchemy.orm import Session

from app.models.borrowing import Borrowing
from app.models.damaged_item_report import DamagedItemReport
from app.models.item import Item
from app.models.open_session import OpenSession
from app.models.user import User
from app.schemas.activity_log import ActivityLogEntry


def get_activity_log(db: Session) -> list[ActivityLogEntry]:
    entries: list[ActivityLogEntry] = []

    # ------------------------------------------------------------------ #
    # 1. Cabinet sessions — open events                                   #
    # ------------------------------------------------------------------ #
    sessions = (
        db.query(OpenSession, User.id, User.name)
        .join(User, User.id == OpenSession.open_by)
        .all()
    )
    for session, user_id, user_name in sessions:
        entries.append(
            ActivityLogEntry(
                event_type="session_open",
                timestamp=session.open_at,
                reference_id=session.id,
                user_id=user_id,
                user_name=user_name,
                item_id=None,
                item_name=None,
                detail=None,
            )
        )
        if session.close_at is not None:
            entries.append(
                ActivityLogEntry(
                    event_type="session_close",
                    timestamp=session.close_at,
                    reference_id=session.id,
                    user_id=user_id,
                    user_name=user_name,
                    item_id=None,
                    item_name=None,
                    detail="image_captured" if session.close_image_path else None,
                )
            )

    # ------------------------------------------------------------------ #
    # 2. Borrowings                                                        #
    # ------------------------------------------------------------------ #
    borrowings = (
        db.query(Borrowing, User.id, User.name, Item.id, Item.name)
        .join(User, User.id == Borrowing.user_id)
        .join(Item, Item.id == Borrowing.item_id)
        .all()
    )
    for borrowing, user_id, user_name, item_id, item_name in borrowings:
        entries.append(
            ActivityLogEntry(
                event_type="borrowing",
                timestamp=borrowing.borrow_at,
                reference_id=borrowing.id,
                user_id=user_id,
                user_name=user_name,
                item_id=item_id,
                item_name=item_name,
                detail=None,
            )
        )
        if borrowing.return_at is not None:
            entries.append(
                ActivityLogEntry(
                    event_type="borrowing_return",
                    timestamp=borrowing.return_at,
                    reference_id=borrowing.id,
                    user_id=user_id,
                    user_name=user_name,
                    item_id=item_id,
                    item_name=item_name,
                    detail=None,
                )
            )

    # ------------------------------------------------------------------ #
    # 3. Damage reports                                                    #
    # ------------------------------------------------------------------ #
    reporter_alias = User.__table__.alias("reporter")
    approver_alias = User.__table__.alias("approver")

    reports = (
        db.query(
            DamagedItemReport,
            reporter_alias.c.id.label("reporter_id"),
            reporter_alias.c.name.label("reporter_name"),
            approver_alias.c.id.label("approver_id"),
            approver_alias.c.name.label("approver_name"),
            Item.id.label("item_id"),
            Item.name.label("item_name"),
        )
        .join(reporter_alias, reporter_alias.c.id == DamagedItemReport.report_by)
        .outerjoin(approver_alias, approver_alias.c.id == DamagedItemReport.approved_by)
        .join(Item, Item.id == DamagedItemReport.item_id)
        .all()
    )

    for row in reports:
        (
            report,
            reporter_id,
            reporter_name,
            approver_id,
            approver_name,
            item_id,
            item_name,
        ) = row

        entries.append(
            ActivityLogEntry(
                event_type="damage_report",
                timestamp=report.report_at,
                reference_id=report.id,
                user_id=reporter_id,
                user_name=reporter_name,
                item_id=item_id,
                item_name=item_name,
                detail=report.topic,
            )
        )

        if report.approved and approver_id is not None:
            entries.append(
                ActivityLogEntry(
                    event_type="damage_report_approved",
                    # Use report_at as timestamp — approved_at not stored separately
                    timestamp=report.report_at,
                    reference_id=report.id,
                    user_id=approver_id,
                    user_name=approver_name,
                    item_id=item_id,
                    item_name=item_name,
                    detail=report.admin_comment,
                )
            )

    # Sort newest first
    entries.sort(key=lambda e: e.timestamp, reverse=True)
    return entries
