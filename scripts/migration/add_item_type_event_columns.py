"""
Migration: add_item_type_event_columns
--------------------------------------
Adds backward-compatible columns to legacy transactions and loans tables so
new vision-based event logging (item_type + qty + slot) works without deleting
old data.

This migration is additive only.

Usage (from backend/):
    python scripts/migration/add_item_type_event_columns.py
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv(ROOT_DIR / ".env")

from sqlalchemy import text
from app.database import engine


def table_exists(conn, table_name: str) -> bool:
    return conn.execute(
        text(
            "SELECT 1 FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_name = :name"
        ),
        {"name": table_name},
    ).fetchone() is not None


def column_exists(conn, table_name: str, column_name: str) -> bool:
    return conn.execute(
        text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = :table AND column_name = :col"
        ),
        {"table": table_name, "col": column_name},
    ).fetchone() is not None


def add_column_if_missing(conn, table_name: str, column_name: str, column_sql: str):
    if not table_exists(conn, table_name):
        print(f"⚠️  Table {table_name} not found; skipping")
        return

    if column_exists(conn, table_name, column_name):
        print(f"  ⏭️  {table_name}.{column_name} already exists")
        return

    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_sql}"))
    print(f"  ✅ Added {table_name}.{column_name}")


def run_migration():
    print("=" * 60)
    print("Migration: add_item_type_event_columns")
    print("=" * 60)

    with engine.begin() as conn:
        print("\nUpdating transactions table...")
        add_column_if_missing(conn, "transactions", "item_type_id", "INTEGER")
        add_column_if_missing(conn, "transactions", "quantity", "INTEGER DEFAULT 1")
        add_column_if_missing(conn, "transactions", "slot_id", "INTEGER")
        add_column_if_missing(conn, "transactions", "session_id", "INTEGER")
        add_column_if_missing(conn, "transactions", "detection_event_id", "INTEGER")

        print("\nUpdating loans table...")
        add_column_if_missing(conn, "loans", "item_type_id", "INTEGER")
        add_column_if_missing(conn, "loans", "quantity", "INTEGER DEFAULT 1")
        add_column_if_missing(conn, "loans", "slot_id", "INTEGER")
        add_column_if_missing(conn, "loans", "source_action", "VARCHAR DEFAULT 'borrow'")

    print("\n✅ Migration complete.")


if __name__ == "__main__":
    run_migration()
