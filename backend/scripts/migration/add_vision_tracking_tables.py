"""
Migration: add_vision_tracking_tables
---------------------------------------
Adds all vision-based drawer tracking tables to an existing database without
touching any legacy tables (items, loans, transactions, users, etc.).

SQLAlchemy's create_all() is idempotent — it skips tables that already exist,
so this script is safe to run multiple times.

Usage (from backend/):
    python scripts/migration/add_vision_tracking_tables.py

Or with a custom DB URL:
    DATABASE_URL=postgresql://... python scripts/migration/add_vision_tracking_tables.py
"""

import os
import sys
from pathlib import Path

# Allow imports from the backend/ root even when run from scripts/
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

from app.database import Base, engine

# Import every new model so SQLAlchemy registers its table in Base.metadata.
# Legacy models are intentionally NOT imported here — we only want to migrate
# the new tables. If you want to recreate everything from scratch, use init_db()
# in main.py instead.
from app.models.item_type import ItemType                  # noqa: F401
from app.models.item_type_image import ItemTypeImage       # noqa: F401
from app.models.drawer import Drawer                       # noqa: F401
from app.models.drawer_slot import DrawerSlot              # noqa: F401
from app.models.drawer_session import DrawerSession        # noqa: F401
from app.models.drawer_snapshot import DrawerSnapshot      # noqa: F401
from app.models.slot_occupancy import SlotOccupancy        # noqa: F401
from app.models.detection_event import DetectionEvent      # noqa: F401
from app.models.inventory_event import InventoryEvent      # noqa: F401
from app.models.exception_case import ExceptionCase        # noqa: F401

NEW_TABLES = [
    "item_types",
    "item_type_images",
    "drawers",
    "drawer_slots",
    "drawer_sessions",
    "drawer_snapshots",
    "slot_occupancies",
    "detection_events",
    "inventory_events",
    "exception_cases",
]


def run_migration():
    print("=" * 60)
    print("Migration: add_vision_tracking_tables")
    print("=" * 60)
    print(f"Database: {engine.url}\n")

    print("Creating new tables (skipping existing)...")
    Base.metadata.create_all(bind=engine, tables=[
        Base.metadata.tables[t] for t in NEW_TABLES
        if t in Base.metadata.tables
    ])

    # Verify all target tables now exist
    from sqlalchemy import inspect
    inspector = inspect(engine)
    existing = set(inspector.get_table_names())

    all_ok = True
    for table in NEW_TABLES:
        status = "✅" if table in existing else "❌ MISSING"
        print(f"  {status}  {table}")
        if table not in existing:
            all_ok = False

    print()
    if all_ok:
        print("✅ Migration complete — all vision tracking tables are ready.")
    else:
        print("❌ Migration incomplete — some tables are missing.")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
