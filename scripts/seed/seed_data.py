"""Canonical v2 seed script.

Seeds all canonical model tables in dependency order and validates that
relationships are present and queryable.

Usage:
    python scripts/seed/seed_data.py
    python scripts/seed/seed_data.py --reset
"""

# pyright: reportMissingImports=false

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

load_dotenv(ROOT_DIR / ".env", override=False)

from app.models.access_session_core import AccessSession
from app.models.audit_log_core import AuditLog
from app.models.inventory_event_core import InventoryEvent
from app.models.item_type_core import ItemType
from app.models.item_type_image_core import ItemTypeImage
from app.models.observation_core import Observation
from app.models.rfid_observation_detail_core import RfidObservationDetail
from app.models.slot_occupancy_core import SlotOccupancy
from app.models.storage_location_core import StorageLocation
from app.models.storage_unit_core import StorageUnit
from app.models.user import User
from app.models.vision_observation_detail_core import VisionObservationDetail


CANONICAL_MODELS = [
    User,
    ItemType,
    ItemTypeImage,
    StorageUnit,
    StorageLocation,
    AccessSession,
    Observation,
    RfidObservationDetail,
    VisionObservationDetail,
    InventoryEvent,
    AuditLog,
    SlotOccupancy,
]


def configure_search_path(session) -> str:
    if session.bind.dialect.name != "postgresql":
        return "main"

    v2_exists = session.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'v2'
                  AND table_name = 'users'
            )
            """
        )
    ).scalar_one()

    schema = "v2" if v2_exists else "public"
    session.execute(text(f"SET search_path TO {schema}, public"))
    return schema


def ensure_clean_database(session) -> None:
    dirty_models = []
    for model in CANONICAL_MODELS:
        if session.query(model).limit(1).first() is not None:
            dirty_models.append(model.__tablename__)

    if dirty_models:
        tables = ", ".join(dirty_models)
        raise RuntimeError(
            "Database is not clean for canonical seed. "
            f"Non-empty tables: {tables}. Run with --reset to clear canonical tables first."
        )


def clear_canonical_tables(session, schema: str) -> None:
    if session.bind.dialect.name == "postgresql":
        if schema not in {"v2", "public"}:
            raise RuntimeError(f"Unexpected schema: {schema}")
        session.execute(
            text(
                f"""
                TRUNCATE TABLE
                    {schema}.slot_occupancies,
                    {schema}.audit_logs,
                    {schema}.inventory_events,
                    {schema}.vision_observation_details,
                    {schema}.rfid_observation_details,
                    {schema}.observations,
                    {schema}.access_sessions,
                    {schema}.storage_locations,
                    {schema}.storage_units,
                    {schema}.item_type_images,
                    {schema}.item_types,
                    {schema}.users
                RESTART IDENTITY CASCADE
                """
            )
        )
        return

    for model in reversed(CANONICAL_MODELS):
        session.query(model).delete(synchronize_session=False)

    sqlite_sequence_exists = session.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM sqlite_master
                WHERE type = 'table' AND name = 'sqlite_sequence'
            )
            """
        )
    ).scalar_one()
    if sqlite_sequence_exists:
        session.execute(text("DELETE FROM sqlite_sequence"))


def seed_canonical(session) -> None:
    now = datetime.utcnow()

    users = [
        User(nfc_card_uid="A1B2C3D4", name="Alice Admin", email="alice.admin@example.com", role="admin", active=True),
        User(nfc_card_uid="S1T2U3D4", name="Somchai Student", email="somchai.student@example.com", role="user", active=True),
        User(nfc_card_uid="S5T6U7D8", name="Suda Student", email="suda.student@example.com", role="user", active=True),
    ]
    session.add_all(users)
    session.flush()
    user_by_uid = {user.nfc_card_uid: user for user in users}

    item_types = [
        ItemType(name="Multimeter", active=True),
        ItemType(name="Soldering Iron", active=True),
        ItemType(name="Screwdriver Set", active=True),
    ]
    session.add_all(item_types)
    session.flush()
    item_type_by_name = {item_type.name: item_type for item_type in item_types}

    item_images = [
        ItemTypeImage(
            item_type_id=item_type_by_name["Multimeter"].id,
            image_url="https://example.com/images/item-types/multimeter-main.jpg",
            is_primary=True,
        ),
        ItemTypeImage(
            item_type_id=item_type_by_name["Soldering Iron"].id,
            image_url="https://example.com/images/item-types/soldering-iron-main.jpg",
            is_primary=True,
        ),
        ItemTypeImage(
            item_type_id=item_type_by_name["Screwdriver Set"].id,
            image_url="https://example.com/images/item-types/screwdriver-main.jpg",
            is_primary=True,
        ),
    ]
    session.add_all(item_images)

    units = [
        StorageUnit(unit_type="drawer", layout_type="grid", active=True),
        StorageUnit(unit_type="shelf", layout_type="zone", active=True),
    ]
    session.add_all(units)
    session.flush()

    drawer_unit = units[0]
    shelf_unit = units[1]

    locations = [
        StorageLocation(unit_id=drawer_unit.id, level_no=1, row_no=1, col_no=1, zone_code=None, active=True),
        StorageLocation(unit_id=drawer_unit.id, level_no=1, row_no=1, col_no=2, zone_code=None, active=True),
        StorageLocation(unit_id=drawer_unit.id, level_no=1, row_no=2, col_no=1, zone_code=None, active=True),
        StorageLocation(unit_id=shelf_unit.id, level_no=1, row_no=None, col_no=None, zone_code="LEFT_BIN", active=True),
        StorageLocation(unit_id=shelf_unit.id, level_no=1, row_no=None, col_no=None, zone_code="RIGHT_BIN", active=True),
    ]
    session.add_all(locations)
    session.flush()

    location_a1 = locations[0]
    location_a2 = locations[1]
    location_b1 = locations[2]
    location_left_bin = locations[3]

    sessions = [
        AccessSession(
            user_id=user_by_uid["S1T2U3D4"].id,
            unit_id=drawer_unit.id,
            opened_at=now - timedelta(minutes=15),
            closed_at=now - timedelta(minutes=10),
            status="closed",
        ),
        AccessSession(
            user_id=user_by_uid["S5T6U7D8"].id,
            unit_id=shelf_unit.id,
            opened_at=now - timedelta(minutes=8),
            closed_at=None,
            status="open",
        ),
    ]
    session.add_all(sessions)
    session.flush()

    closed_session = sessions[0]
    open_session = sessions[1]

    observations = [
        Observation(
            session_id=closed_session.id,
            location_id=None,
            source_type="rfid",
            change_type="removed",
            confidence=0.97,
            review_status="normal",
            review_note=None,
            observed_at=now - timedelta(minutes=14),
        ),
        Observation(
            session_id=closed_session.id,
            location_id=location_a1.id,
            source_type="vision",
            change_type="changed",
            confidence=0.91,
            review_status="normal",
            review_note=None,
            observed_at=now - timedelta(minutes=13),
        ),
        Observation(
            session_id=open_session.id,
            location_id=location_left_bin.id,
            source_type="vision",
            change_type="unchanged",
            confidence=0.88,
            review_status="needs_review",
            review_note="Low light at shelf zone",
            observed_at=now - timedelta(minutes=6),
        ),
    ]
    session.add_all(observations)
    session.flush()

    rfid_detail = RfidObservationDetail(
        observation_id=observations[0].id,
        tag_uid="TAG-MULTIMETER-001",
        reader_id="reader-drawer-01",
        rssi=-54,
        read_count=3,
    )
    session.add(rfid_detail)

    vision_details = [
        VisionObservationDetail(
            observation_id=observations[1].id,
            before_image_url="https://example.com/images/vision/session1-before-a1.jpg",
            after_image_url="https://example.com/images/vision/session1-after-a1.jpg",
            crop_url="https://example.com/images/vision/session1-crop-a1.jpg",
            model_version="vision-v2.1.0",
            raw_predictions_json={
                "predictions": [
                    {"label": "Multimeter", "confidence": 0.91},
                    {"label": "Screwdriver Set", "confidence": 0.18},
                ]
            },
        ),
        VisionObservationDetail(
            observation_id=observations[2].id,
            before_image_url="https://example.com/images/vision/session2-before-left-bin.jpg",
            after_image_url="https://example.com/images/vision/session2-after-left-bin.jpg",
            crop_url="https://example.com/images/vision/session2-crop-left-bin.jpg",
            model_version="vision-v2.1.0",
            raw_predictions_json={"predictions": [{"label": "Soldering Iron", "confidence": 0.88}]},
        ),
    ]
    session.add_all(vision_details)

    events = [
        InventoryEvent(
            session_id=closed_session.id,
            user_id=user_by_uid["S1T2U3D4"].id,
            item_type_id=item_type_by_name["Multimeter"].id,
            event_type="borrow",
            quantity=1,
            location_id=location_a1.id,
            observation_id=observations[1].id,
            note="Borrowed from drawer position A1",
            created_at=now - timedelta(minutes=12),
        ),
        InventoryEvent(
            session_id=open_session.id,
            user_id=user_by_uid["S5T6U7D8"].id,
            item_type_id=item_type_by_name["Soldering Iron"].id,
            event_type="adjustment",
            quantity=1,
            location_id=location_left_bin.id,
            observation_id=observations[2].id,
            note="Pending manual confirmation due to low light",
            created_at=now - timedelta(minutes=5),
        ),
    ]
    session.add_all(events)
    session.flush()

    audit_logs = [
        AuditLog(
            ts=now - timedelta(minutes=16),
            actor_type="user",
            actor_id="S1T2U3D4",
            action="scan",
            target_type="storage_unit",
            target_id=str(drawer_unit.id),
            result="success",
            ip_address="10.0.0.21",
            message="User card scanned at drawer kiosk",
            correlation_id="seed-corr-001",
        ),
        AuditLog(
            ts=now - timedelta(minutes=15),
            actor_type="device",
            actor_id="kiosk-drawer-01",
            action="unlock",
            target_type="storage_unit",
            target_id=str(drawer_unit.id),
            result="success",
            ip_address="10.0.0.11",
            message="Drawer unlocked",
            correlation_id="seed-corr-001",
        ),
        AuditLog(
            ts=now - timedelta(minutes=8),
            actor_type="user",
            actor_id="S5T6U7D8",
            action="scan",
            target_type="storage_unit",
            target_id=str(shelf_unit.id),
            result="success",
            ip_address="10.0.0.22",
            message="User card scanned at shelf kiosk",
            correlation_id="seed-corr-002",
        ),
    ]
    session.add_all(audit_logs)

    occupancies = [
        SlotOccupancy(
            location_id=location_a1.id,
            state="occupied",
            item_type_id=item_type_by_name["Multimeter"].id,
            confidence=0.91,
            last_event_id=events[0].id,
        ),
        SlotOccupancy(
            location_id=location_a2.id,
            state="empty",
            item_type_id=None,
            confidence=0.99,
            last_event_id=None,
        ),
        SlotOccupancy(
            location_id=location_b1.id,
            state="unknown",
            item_type_id=None,
            confidence=None,
            last_event_id=None,
        ),
        SlotOccupancy(
            location_id=location_left_bin.id,
            state="occupied",
            item_type_id=item_type_by_name["Soldering Iron"].id,
            confidence=0.88,
            last_event_id=events[1].id,
        ),
    ]
    session.add_all(occupancies)


def validate_seed(session) -> None:
    counts = {
        "users": session.query(User).count(),
        "item_types": session.query(ItemType).count(),
        "item_type_images": session.query(ItemTypeImage).count(),
        "storage_units": session.query(StorageUnit).count(),
        "storage_locations": session.query(StorageLocation).count(),
        "access_sessions": session.query(AccessSession).count(),
        "observations": session.query(Observation).count(),
        "rfid_observation_details": session.query(RfidObservationDetail).count(),
        "vision_observation_details": session.query(VisionObservationDetail).count(),
        "inventory_events": session.query(InventoryEvent).count(),
        "audit_logs": session.query(AuditLog).count(),
        "slot_occupancies": session.query(SlotOccupancy).count(),
    }

    missing = [table for table, count in counts.items() if count == 0]
    if missing:
        raise RuntimeError(f"Seed validation failed. Empty canonical tables: {', '.join(missing)}")

    orphan_rfid = session.execute(
        text(
            """
            SELECT COUNT(*)
            FROM rfid_observation_details d
            LEFT JOIN observations o ON o.id = d.observation_id
            WHERE o.id IS NULL
            """
        )
    ).scalar_one()
    orphan_vision = session.execute(
        text(
            """
            SELECT COUNT(*)
            FROM vision_observation_details d
            LEFT JOIN observations o ON o.id = d.observation_id
            WHERE o.id IS NULL
            """
        )
    ).scalar_one()
    orphan_slot_event = session.execute(
        text(
            """
            SELECT COUNT(*)
            FROM slot_occupancies s
            LEFT JOIN inventory_events e ON e.id = s.last_event_id
            WHERE s.last_event_id IS NOT NULL
              AND e.id IS NULL
            """
        )
    ).scalar_one()

    if orphan_rfid or orphan_vision or orphan_slot_event:
        raise RuntimeError(
            "Seed validation failed. "
            f"orphan_rfid={orphan_rfid}, "
            f"orphan_vision={orphan_vision}, "
            f"orphan_slot_event={orphan_slot_event}"
        )

    print("Seed summary (canonical tables):")
    for table_name, count in counts.items():
        print(f"- {table_name}: {count}")


def create_session_factory(database_url: str):
    normalized_url = database_url.strip().replace("postgres://", "postgresql://", 1)
    if normalized_url.startswith("sqlite"):
        db_engine = create_engine(normalized_url, connect_args={"check_same_thread": False})
    else:
        db_engine = create_engine(normalized_url)
    return sessionmaker(autocommit=False, autoflush=False, bind=db_engine)


def run_seed(reset: bool, database_url: str) -> None:
    SessionFactory = create_session_factory(database_url)
    session = SessionFactory()
    try:
        schema = configure_search_path(session)
        if reset:
            print(f"Clearing canonical tables (schema={schema})...")
            clear_canonical_tables(session, schema)
            session.commit()
        else:
            ensure_clean_database(session)

        print(f"Seeding canonical model set (schema={schema})...")
        seed_canonical(session)
        session.commit()

        validate_seed(session)
        print("Canonical seed completed successfully.")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed canonical v2 model tables")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear canonical tables before seeding",
    )
    parser.add_argument(
        "--database-url",
        default=os.getenv("DATABASE_URL", "sqlite:///./inventory.db"),
        help="Database URL for seeding target (default: DATABASE_URL or sqlite:///./inventory.db)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    run_seed(reset=args.reset, database_url=args.database_url)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
