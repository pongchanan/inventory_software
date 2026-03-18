"""
Migration: add_item_type_event_columns
--------------------------------------
Adds backward-compatible columns to legacy transactions and loans tables so
new vision-based event logging (item_type + qty + slot) works without deleting
old data.

This migration is additive only.

Usage (from backend/):
    python scripts/migration/add_item_type_event_columns.py --dry-run
    python scripts/migration/add_item_type_event_columns.py --execute
"""

import argparse
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv(ROOT_DIR / ".env")

from sqlalchemy import text
from app.database import engine

from dry_run_report import DryRunReport, OperationType, create_migration_operation


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


def add_column_if_missing(conn, table_name: str, column_name: str, column_sql: str, dry_run: bool = False, report: DryRunReport = None):
    if not table_exists(conn, table_name):
        msg = f"⚠️  Table {table_name} not found; skipping"
        print(msg)
        if report:
            report.add_warning(f"Table {table_name} not found")
        return

    if column_exists(conn, table_name, column_name):
        print(f"  ⏭️  {table_name}.{column_name} already exists")
        if report:
            report.add_operation(create_migration_operation(
                OperationType.COLUMN_ADD,
                target_table=table_name,
                description=f"{column_name}: already exists",
                status="skipped",
            ))
        return

    if dry_run:
        print(f"  [DRY RUN] Would add {table_name}.{column_name}")
        if report:
            report.add_operation(create_migration_operation(
                OperationType.COLUMN_ADD,
                target_table=table_name,
                description=f"{column_name}: {column_sql}",
                status="would_execute",
            ))
    else:
        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_sql}"))
        print(f"  ✅ Added {table_name}.{column_name}")


def run_migration(dry_run: bool = False, report: DryRunReport = None):
    print("=" * 60)
    print("Migration: add_item_type_event_columns")
    print(f"Mode: {'DRY-RUN' if dry_run else 'EXECUTE'}")
    print("=" * 60)

    with engine.begin() as conn:
        print("\nUpdating transactions table...")
        add_column_if_missing(conn, "transactions", "item_type_id", "INTEGER", dry_run, report)
        add_column_if_missing(conn, "transactions", "quantity", "INTEGER DEFAULT 1", dry_run, report)
        add_column_if_missing(conn, "transactions", "slot_id", "INTEGER", dry_run, report)
        add_column_if_missing(conn, "transactions", "session_id", "INTEGER", dry_run, report)
        add_column_if_missing(conn, "transactions", "detection_event_id", "INTEGER", dry_run, report)

        print("\nUpdating loans table...")
        add_column_if_missing(conn, "loans", "item_type_id", "INTEGER", dry_run, report)
        add_column_if_missing(conn, "loans", "quantity", "INTEGER DEFAULT 1", dry_run, report)
        add_column_if_missing(conn, "loans", "slot_id", "INTEGER", dry_run, report)
        add_column_if_missing(conn, "loans", "source_action", "VARCHAR DEFAULT 'borrow'", dry_run, report)

    print("\n✅ Migration complete.")


def main():
    parser = argparse.ArgumentParser(description="Add event columns to legacy tables")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without executing")
    parser.add_argument("--execute", action="store_true", help="Execute the migration")
    parser.add_argument("--report", type=str, default="", help="Save dry-run report to file (format: ascii, json, markdown)")
    args = parser.parse_args()

    if not args.dry_run and not args.execute:
        parser.error("Choose either --dry-run or --execute")

    # Initialize report if dry-run
    report = None
    if args.dry_run:
        report = DryRunReport(
            script_name="add_item_type_event_columns.py",
            database_url=str(engine.url),
        )

    run_migration(dry_run=args.dry_run, report=report)
    
    # Print and save report if dry-run
    if args.dry_run and report:
        report.print_ascii()
        if args.report:
            # Parse format from filename or use default
            format_map = {"json": "json", "md": "markdown", "txt": "ascii"}
            fmt = "ascii"
            for ext, fmt_type in format_map.items():
                if args.report.endswith(f".{ext}"):
                    fmt = fmt_type
                    break
            report.save_report(args.report, format=fmt)


if __name__ == "__main__":
    main()

