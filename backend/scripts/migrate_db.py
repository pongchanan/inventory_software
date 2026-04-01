"""Migrate database: create new tables and add missing columns without dropping data.

Usage:
    cd backend
    .\\venv\\Scripts\\python.exe scripts\\migrate_db.py
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import inspect, text

from app.database import Base, engine
import app.models  # noqa: F401


def get_existing_columns(inspector, table_name: str) -> set[str]:
    return {col["name"] for col in inspector.get_columns(table_name)}


def migrate():
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    # 1. Create any brand-new tables
    new_tables = []
    for table in Base.metadata.sorted_tables:
        if table.name not in existing_tables:
            table.create(bind=engine)
            new_tables.append(table.name)
            print(f"  Created table: {table.name}")

    if not new_tables:
        print("  No new tables needed")

    # 2. Add missing columns to existing tables
    added_columns = []
    with engine.begin() as conn:
        # Refresh inspector after possible table creation
        inspector = inspect(engine)
        for table in Base.metadata.sorted_tables:
            if table.name not in existing_tables:
                continue  # Already created above

            existing_cols = get_existing_columns(inspector, table.name)

            for column in table.columns:
                if column.name in existing_cols:
                    continue

                # Build ALTER TABLE ADD COLUMN
                col_type = column.type.compile(engine.dialect)
                nullable = "NULL" if column.nullable else "NOT NULL"
                default_clause = ""

                if column.default is not None:
                    val = column.default.arg
                    if callable(val):
                        # Skip server-side callables (e.g. datetime.utcnow)
                        # Column will be added as nullable first
                        nullable = "NULL"
                    elif isinstance(val, bool):
                        default_clause = f" DEFAULT {str(val).upper()}"
                    elif isinstance(val, (int, float)):
                        default_clause = f" DEFAULT {val}"
                    else:
                        default_clause = f" DEFAULT '{val}'"

                sql = f'ALTER TABLE "{table.name}" ADD COLUMN "{column.name}" {col_type} {nullable}{default_clause}'
                conn.execute(text(sql))
                added_columns.append(f"{table.name}.{column.name}")
                print(
                    f"  Added column: {table.name}.{column.name} ({col_type} {nullable}{default_clause})"
                )

    if not added_columns:
        print("  No new columns needed")

    print("\nMigration complete.")
    print(f"  Tables in database: {inspector.get_table_names()}")


if __name__ == "__main__":
    print("Running migration...")
    migrate()
