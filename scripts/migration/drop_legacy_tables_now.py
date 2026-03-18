"""Drop legacy tables immediately and keep only core model tables.

This script is idempotent. It can be run multiple times.
"""

import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

from dry_run_report import DryRunReport, OperationType, create_migration_operation

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


def run(dry_run: bool = False, report: DryRunReport = None) -> None:
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
            
            if dry_run:
                for table in targets:
                    print(f"Would drop (cascade): {table}")
                    if report:
                        report.add_operation(create_migration_operation(
                            OperationType.TABLE_DROP,
                            source_table=table,
                            status="would_execute",
                            description="Drop legacy table with CASCADE",
                        ))
            else:
                for table in targets:
                    conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                    print(f"Dropped (if existed): {table}")
        else:
            all_tables = LEGACY_TABLES + COMPAT_TABLES
            
            if dry_run:
                for table in all_tables:
                    print(f"Would drop: {table}")
                    if report:
                        report.add_operation(create_migration_operation(
                            OperationType.TABLE_DROP,
                            source_table=table,
                            status="would_execute",
                            description="Drop legacy table",
                        ))
            else:
                for table in all_tables:
                    conn.execute(text(f"DROP TABLE IF EXISTS {table}"))
                    print(f"Dropped (if existed): {table}")

    print("Legacy table cut completed.")


def main():
    parser = argparse.ArgumentParser(description="Drop legacy tables from database")
    parser.add_argument("--dry-run", action="store_true", help="Preview tables that would be dropped")
    parser.add_argument("--execute", action="store_true", help="Execute table drops")
    parser.add_argument("--report", type=str, default="", help="Save dry-run report to file (format: ascii, json, markdown)")
    args = parser.parse_args()

    if not args.dry_run and not args.execute:
        parser.error("Choose either --dry-run or --execute")

    # Initialize report if dry-run
    report = None
    if args.dry_run:
        report = DryRunReport(
            script_name="drop_legacy_tables_now.py",
            database_url=DATABASE_URL,
        )

    run(dry_run=args.dry_run, report=report)
    
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
