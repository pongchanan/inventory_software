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
    """Check for overdue and due-tomorrow borrowings, with error handling."""
    db: Session = SessionLocal()
    try:
        print("[DUE-CHECK] Starting due date check...")
        now = datetime.utcnow()
        tomorrow = now + timedelta(days=1)

        # Active borrowings (not returned)
        # Note: We do NOT join all tables at once to avoid connection pool issues
        # Instead, we query borrowings first, then fetch users/items separately
        try:
            borrowings_data = (
                db.query(Borrowing)
                .filter(Borrowing.return_at == None)  # noqa: E711
                .all()
            )
            print(f"[DUE-CHECK] Found {len(borrowings_data)} active borrowings")
        except Exception as query_error:
            print(f"[DUE-CHECK] Error querying borrowings: {query_error}")
            return

        for borrowing in borrowings_data:
            try:
                due = borrowing.due_at
                
                # Lazy-load the relationships within the try block
                user_name = borrowing.user.name if borrowing.user else "Unknown User"
                item_name = borrowing.item.name if borrowing.item else "Unknown Item"
                user_email = borrowing.user.email if borrowing.user else None

                if not user_email:
                    print(f"[DUE-CHECK] Warning: No email for borrowing {borrowing.id}")
                    continue

                if due <= now:
                    # OVERDUE — send overdue email every check cycle
                    print(f"[DUE-CHECK] Sending overdue email to {user_name} for {item_name}")
                    send_email(
                        to=user_email,
                        subject=f'OVERDUE: Please return "{item_name}"',
                        body=_overdue_email(user_name, item_name, due),
                    )
                elif due <= tomorrow:
                    # DUE TOMORROW — send warning email
                    print(f"[DUE-CHECK] Sending due-tomorrow email to {user_name} for {item_name}")
                    send_email(
                        to=user_email,
                        subject=f'Reminder: "{item_name}" is due tomorrow',
                        body=_warning_email(user_name, item_name, due),
                    )
            except Exception as borrow_error:
                print(f"[DUE-CHECK] Error processing borrowing {borrowing.id}: {borrow_error}")
                continue

        print("[DUE-CHECK] Due date check completed successfully")

    except Exception as e:
        print(f"[DUE-CHECK] Unexpected error: {type(e).__name__}: {e}")
        # Don't re-raise, just log and continue
    finally:
        try:
            db.close()
            print("[DUE-CHECK] Database session closed")
        except Exception as close_error:
            print(f"[DUE-CHECK] Error closing database session: {close_error}")


def _warning_email(name: str, item_name: str, due_at: datetime) -> str:
    due_str = due_at.strftime("%B %d, %Y at %H:%M")
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:32px 40px;text-align:center;">
                <div style="font-size:28px;margin-bottom:4px;">&#9200;</div>
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Due Date Reminder</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px 40px;">
                <p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.6;">Hi <strong>{name}</strong>,</p>
                <p style="margin:0 0 24px;color:#334155;font-size:16px;line-height:1.6;">
                  This is a friendly reminder that the item you borrowed is due soon. Please return it on time to avoid overdue notices.
                </p>
                <!-- Item Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:24px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="margin:0 0 4px;color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Item</p>
                      <p style="margin:0 0 12px;color:#1e293b;font-size:18px;font-weight:700;">{item_name}</p>
                      <p style="margin:0 0 4px;color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Due Date</p>
                      <p style="margin:0;color:#1e293b;font-size:16px;font-weight:600;">{due_str}</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;color:#64748b;font-size:14px;line-height:1.5;">
                  If you have already returned this item, please disregard this email.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">Smart Inventory System &bull; Automated Notification</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """


def _overdue_email(name: str, item_name: str, due_at: datetime) -> str:
    due_str = due_at.strftime("%B %d, %Y at %H:%M")
    now = datetime.utcnow()
    days_overdue = (now - due_at).days
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px 40px;text-align:center;">
                <div style="font-size:28px;margin-bottom:4px;">&#9888;&#65039;</div>
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Overdue Notice</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px 40px;">
                <p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.6;">Hi <strong>{name}</strong>,</p>
                <p style="margin:0 0 24px;color:#334155;font-size:16px;line-height:1.6;">
                  The following item is <strong>overdue</strong> and has not been returned. Please return it as soon as possible.
                </p>
                <!-- Item Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="margin:0 0 4px;color:#991b1b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Item</p>
                      <p style="margin:0 0 12px;color:#1e293b;font-size:18px;font-weight:700;">{item_name}</p>
                      <p style="margin:0 0 4px;color:#991b1b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Was Due</p>
                      <p style="margin:0 0 12px;color:#1e293b;font-size:16px;font-weight:600;">{due_str}</p>
                      <p style="margin:0 0 4px;color:#991b1b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Days Overdue</p>
                      <p style="margin:0;color:#dc2626;font-size:20px;font-weight:800;">{days_overdue} day{"s" if days_overdue != 1 else ""}</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;color:#64748b;font-size:14px;line-height:1.5;">
                  You will continue to receive reminders until the item is returned.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">Smart Inventory System &bull; Automated Notification</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
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
