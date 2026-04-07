"""One-time migration: add enroll_status column to the items table.

Run once against production / staging before deploying the updated backend:

    cd <repo-root>
    python scripts/migration/add_enroll_status.py

The script is idempotent — safe to run multiple times.
"""

import os
import sys
from pathlib import Path

# Allow importing app.* from the backend directory
BACKEND_DIR = Path(__file__).resolve().parents[2] / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv

load_dotenv(BACKEND_DIR / ".env", override=True)

from sqlalchemy import text
from app.database import engine


def main() -> None:
    with engine.begin() as conn:
        # Check if the column already exists (PostgreSQL)
        exists = conn.execute(
            text(
                """
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'items'
                  AND column_name = 'enroll_status'
                """
            )
        ).fetchone()

        if exists:
            print("Column 'enroll_status' already exists — nothing to do.")
            return

        conn.execute(text("ALTER TABLE items ADD COLUMN enroll_status VARCHAR"))
        print("Added column 'enroll_status' to table 'items'.")

        # Any existing item rows keep NULL (they were created before async
        # enrollment existed; NULL means "not an enrollment job").
        print("Existing rows left as NULL (not enrollment jobs).")


if __name__ == "__main__":
    main()
