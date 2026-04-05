"""
Send an overdue notice email to a specific address.

Usage:
    python scripts/test_overdue_email.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)

from datetime import datetime, timedelta
from app.services.email_service import send_email
from app.services.due_date_checker import _overdue_email

if __name__ == "__main__":
    to = input("Send overdue email to: ").strip()
    if not to:
        print("No email provided, exiting.")
        sys.exit(1)

    name = "Test User"
    item_name = "Screwdriver Set"
    overdue = datetime.utcnow() - timedelta(days=2)

    ok = send_email(
        to=to,
        subject=f'OVERDUE: Please return "{item_name}"',
        body=_overdue_email(name, item_name, overdue),
    )
    print(f"Overdue email: {'SENT' if ok else 'FAILED'}")
