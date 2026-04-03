import asyncio
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.borrowing import Borrowing
from app.models.item import Item
from app.models.user import User
from app.services.email_service import send_email

CHECK_INTERVAL_SECONDS = 60 * 60  # Run every hour

_task: asyncio.Task | None = None


def _check_due_dates():
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        tomorrow = now + timedelta(days=1)

        # Active borrowings (not returned)
        borrowings = (
            db.query(Borrowing, User, Item)
            .join(User, Borrowing.user_id == User.id)
            .join(Item, Borrowing.item_id == Item.id)
            .filter(Borrowing.return_at == None)  # noqa: E711
            .all()
        )

        for borrowing, user, item in borrowings:
            due = borrowing.due_at

            if due <= now:
                # OVERDUE — send overdue email every check cycle
                send_email(
                    to=user.email,
                    subject=f'OVERDUE: Please return "{item.name}"',
                    body=_overdue_email(user.name, item.name, due),
                )
            elif due <= tomorrow:
                # DUE TOMORROW — send warning email
                send_email(
                    to=user.email,
                    subject=f'Reminder: "{item.name}" is due tomorrow',
                    body=_warning_email(user.name, item.name, due),
                )

    except Exception as e:
        print(f"[DUE-CHECK] Error: {e}")
    finally:
        db.close()


def _warning_email(name: str, item_name: str, due_at: datetime) -> str:
    return f"""
    <h2>Borrowing Reminder</h2>
    <p>Hi {name},</p>
    <p>This is a reminder that <strong>{item_name}</strong> is due on
    <strong>{due_at.strftime('%B %d, %Y %H:%M')}</strong>.</p>
    <p>Please return it before the due date to avoid overdue notices.</p>
    <p>— Smart Inventory System</p>
    """


def _overdue_email(name: str, item_name: str, due_at: datetime) -> str:
    return f"""
    <h2>Overdue Notice</h2>
    <p>Hi {name},</p>
    <p><strong>{item_name}</strong> was due on
    <strong>{due_at.strftime('%B %d, %Y %H:%M')}</strong> and has not been returned.</p>
    <p>Please return it as soon as possible.</p>
    <p>— Smart Inventory System</p>
    """


async def _scheduler():
    while True:
        print("[DUE-CHECK] Running due date check...")
        await asyncio.get_event_loop().run_in_executor(None, _check_due_dates)
        await asyncio.sleep(CHECK_INTERVAL_SECONDS)


def start_due_date_checker():
    global _task
    _task = asyncio.create_task(_scheduler())
    print("[DUE-CHECK] Background scheduler started (interval: 1h)")


def stop_due_date_checker():
    global _task
    if _task:
        _task.cancel()
        _task = None
        print("[DUE-CHECK] Background scheduler stopped")
