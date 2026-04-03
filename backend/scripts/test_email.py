"""Quick script to test SMTP email sending."""

import os
import sys
from pathlib import Path

# Load env
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)

from app.services.email_service import send_email

if __name__ == "__main__":
    to = input("Send test email to: ").strip()
    if not to:
        print("No email provided, exiting.")
        sys.exit(1)

    ok = send_email(
        to=to,
        subject="Smart Inventory — Test Email",
        body="""
        <h2>Test Email</h2>
        <p>If you see this, SMTP is configured correctly.</p>
        <p>— Smart Inventory System</p>
        """,
    )
    print("SUCCESS" if ok else "FAILED — check SMTP env vars")
