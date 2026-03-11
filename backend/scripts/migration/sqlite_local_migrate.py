"""
Migration: sqlite_local_migrate
--------------------------------
Creates/updates local SQLite schema for development.

What this script does:
  1) Forces DATABASE_URL to sqlite:///./inventory.db
  2) Creates all SQLAlchemy tables (idempotent)
  3) Adds legacy compatibility columns for transactions/loans if missing

Usage (from backend/):
    python scripts/migration/sqlite_local_migrate.py
"""

import os
import sys
from pathlib import Path

# Allow imports from backend/
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[3]
load_dotenv(ROOT_DIR / ".env", override=True)
os.environ["DATABASE_URL"] = "sqlite:///./inventory.db"

import app.models  # noqa: F401
from sqlalchemy import text
from app.database import Base, engine


def table_exists(conn, table_name: str) -> bool:
    return conn.execute(
        text("SELECT name FROM sqlite_master WHERE type='table' AND name=:name"),
        {"name": table_name},
    ).fetchone() is not None


def column_exists(conn, table_name: str, column_name: str) -> bool:
    rows = conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    return any(r[1] == column_name for r in rows)


def add_column_if_missing(conn, table_name: str, column_name: str, column_sql: str):
    if not table_exists(conn, table_name):
        print(f"  ⚠ Table {table_name} not found; skipping")
        return

    if column_exists(conn, table_name, column_name):
        print(f"  ⏭ {table_name}.{column_name} already exists")
        return

    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_sql}"))
    print(f"  ✅ Added {table_name}.{column_name}")


def run_migration():
    print("=" * 60)
    print("Migration: sqlite_local_migrate")
    print("=" * 60)
    print(f"Database: {engine.url}\n")

    print("Creating all tables (idempotent)...")
    Base.metadata.create_all(bind=engine)

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

    print("\n✅ SQLite migration complete.")


if __name__ == "__main__":
    run_migration()
