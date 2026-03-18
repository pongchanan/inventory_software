"""Drop legacy tables immediately and keep only core model tables.

This script is idempotent. It can be run multiple times.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env", override=True)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./inventory.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

# Tables removed in the big-bang legacy cut.
LEGACY_TABLES = [
    "approvals",
    "compartments",
    "transactions",
    "loans",
    "items",
    "drawers",
    "drawer_slots",
    "drawer_sessions",
    "drawer_snapshots",
    "detection_events",
    "exception_cases",
]

# Backward-compat temporary tables used in previous transitions.
COMPAT_TABLES = [
    "legacy_users",
    "legacy_items",
    "legacy_item_types",
    "legacy_loans",
]


def run() -> None:
    with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            rows = conn.execute(
                text(
                    """
                    SELECT tablename
                    FROM pg_tables
                    WHERE schemaname = 'public'
                      AND (
                        tablename = ANY(:target_tables)
                        OR tablename LIKE 'legacy_%'
                      )
                    """
                ),
                {"target_tables": LEGACY_TABLES + COMPAT_TABLES},
            ).fetchall()
            targets = [row[0] for row in rows]
            for table in targets:
                conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                print(f"Dropped (if existed): {table}")
        else:
            all_tables = LEGACY_TABLES + COMPAT_TABLES
            for table in all_tables:
                conn.execute(text(f"DROP TABLE IF EXISTS {table}"))
                print(f"Dropped (if existed): {table}")

    print("Legacy table cut completed.")


if __name__ == "__main__":
    run()
