"""
Send a due-tomorrow warning email to a specific address.

Usage:
    python scripts/test_due_email.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)

from datetime import datetime, timedelta
from app.services.email_service import send_email
from app.services.due_date_checker import _warning_email

if __name__ == "__main__":
    to = input("Send warning email to: ").strip()
    if not to:
        print("No email provided, exiting.")
        sys.exit(1)

    name = "Test User"
    item_name = "Screwdriver Set"
    due_tomorrow = datetime.utcnow() + timedelta(hours=20)

    ok = send_email(
        to=to,
        subject=f'Reminder: "{item_name}" is due tomorrow',
        body=_warning_email(name, item_name, due_tomorrow),
    )
    print(f"Warning email: {'SENT' if ok else 'FAILED'}")
