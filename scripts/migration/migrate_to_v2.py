"""Shadow migration from public tables into v2 tables."""

import argparse
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker

from dry_run_report import DryRunReport, OperationType, create_migration_operation


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"

load_dotenv(ROOT_DIR / ".env", override=True)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./inventory.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Global report instance
report = None


def apply_shadow_schema(dry_run: bool):
    schema_sql = (BACKEND_DIR / "db" / "schema_v2.sql").read_text(encoding="utf-8")
    statement_count = len([s for s in schema_sql.split(";") if s.strip()])
    
    if dry_run:
        logger.info("[DRY RUN] Would apply schema_v2.sql into schema v2 (%d statements)", statement_count)
        if report:
            report.add_operation(create_migration_operation(
                OperationType.SCHEMA_CREATE,
                description=f"Apply schema_v2.sql ({statement_count} statements)",
                status="would_execute",
            ))
        return

    logger.info("Applying schema_v2.sql into schema v2")
    with engine.begin() as conn:
        for part in schema_sql.split(";"):
            lines = [line for line in part.splitlines() if line.strip() and not line.strip().startswith("--")]
            statement = "\n".join(lines).strip()
            if statement:
                conn.execute(text(statement))


def _qualified_table(table_name: str) -> str:
    if engine.dialect.name == "postgresql":
        return f"public.{table_name}"
    return table_name


def count_rows(db, table_name: str) -> tuple[int, bool]:
    try:
        table_ref = _qualified_table(table_name)
        count = db.execute(text(f"SELECT COUNT(*) FROM {table_ref}")).scalar() or 0
        return int(count), True
    except SQLAlchemyError as exc:
        msg = f"Source table '{table_name}' not found or inaccessible; skipping this operation"
        logger.warning("%s (%s)", msg, exc.__class__.__name__)
        if report:
            report.add_warning(msg)
        return 0, False


def migrate_users(db, dry_run: bool):
    count, available = count_rows(db, "users")
    logger.info("users -> v2.users: %s rows", count)
    
    if report:
        report.add_operation(create_migration_operation(
            OperationType.TABLE_MIGRATE,
            source_table="users",
            target_table="v2.users",
            source_row_count=count,
            status="would_execute" if (dry_run and available) else ("pending" if available else "skipped"),
            description=(f"Migrating {count} user records" if available else "Skipped: source table missing"),
        ))
    
    if dry_run or not available:
        return
    db.execute(text("DELETE FROM v2.users"))
    db.execute(text(
        """
        INSERT INTO v2.users (id, nfc_card_uid, name, email, role, password_hash, active, created_at, updated_at)
        SELECT id, uid, name, email, COALESCE(role, 'user'), password_hash, COALESCE(authorized, TRUE), created_at, updated_at
        FROM public.users
        """
    ))


def migrate_item_types(db, dry_run: bool):
    type_count, types_available = count_rows(db, "item_types")
    image_count, images_available = count_rows(db, "item_type_images")
    logger.info("item_types -> v2.item_types: %s rows", type_count)
    logger.info("item_type_images -> v2.item_type_images: %s rows", image_count)
    
    if report:
        report.add_operation(create_migration_operation(
            OperationType.TABLE_MIGRATE,
            source_table="item_types",
            target_table="v2.item_types",
            source_row_count=type_count,
            status="would_execute" if (dry_run and types_available) else ("pending" if types_available else "skipped"),
            description=(f"Migrating {type_count} item types" if types_available else "Skipped: source table missing"),
        ))
        report.add_operation(create_migration_operation(
            OperationType.TABLE_MIGRATE,
            source_table="item_type_images",
            target_table="v2.item_type_images",
            source_row_count=image_count,
            status="would_execute" if (dry_run and images_available) else ("pending" if images_available else "skipped"),
            description=(f"Migrating {image_count} item type images" if images_available else "Skipped: source table missing"),
        ))
    
    if dry_run:
        return
    if types_available:
        db.execute(text("DELETE FROM v2.item_types"))
        db.execute(text(
            """
            INSERT INTO v2.item_types (id, name, active, created_at, updated_at)
            SELECT id, name, COALESCE(is_active, TRUE), created_at, updated_at
            FROM public.item_types
            """
        ))
    if images_available:
        db.execute(text("DELETE FROM v2.item_type_images"))
        db.execute(text(
            """
            INSERT INTO v2.item_type_images (id, item_type_id, image_url, is_primary, created_at)
            SELECT id, item_type_id, image_url, COALESCE(is_primary, FALSE), created_at
            FROM public.item_type_images
            """
        ))


def migrate_storage(db, dry_run: bool):
    unit_count, units_available = count_rows(db, "drawers")
    location_count, locations_available = count_rows(db, "drawer_slots")
    logger.info("drawers -> v2.storage_units: %s rows", unit_count)
    logger.info("drawer_slots -> v2.storage_locations: %s rows", location_count)
    
    if report:
        report.add_operation(create_migration_operation(
            OperationType.TABLE_MIGRATE,
            source_table="drawers",
            target_table="v2.storage_units",
            source_row_count=unit_count,
            status="would_execute" if (dry_run and units_available) else ("pending" if units_available else "skipped"),
            description=(f"Migrating {unit_count} storage units" if units_available else "Skipped: source table missing"),
        ))
        report.add_operation(create_migration_operation(
            OperationType.TABLE_MIGRATE,
            source_table="drawer_slots",
            target_table="v2.storage_locations",
            source_row_count=location_count,
            status="would_execute" if (dry_run and locations_available) else ("pending" if locations_available else "skipped"),
            description=(f"Migrating {location_count} storage locations" if locations_available else "Skipped: source table missing"),
        ))
    
    if dry_run:
        return
    if units_available:
        db.execute(text("DELETE FROM v2.storage_units"))
        db.execute(text(
            """
            INSERT INTO v2.storage_units (id, unit_type, layout_type, active, created_at, updated_at)
            SELECT id, 'drawer', 'grid', COALESCE(is_active, TRUE), created_at, updated_at
            FROM public.drawers
            """
        ))
    if locations_available:
        db.execute(text("DELETE FROM v2.storage_locations"))
        db.execute(text(
            """
            INSERT INTO v2.storage_locations (id, unit_id, level_no, row_no, col_no, zone_code, active, created_at)
            SELECT id, drawer_id, 0, row_index, col_index, NULL, COALESCE(is_active, TRUE), created_at
            FROM public.drawer_slots
            """
        ))


def migrate_sessions(db, dry_run: bool):
    count, available = count_rows(db, "drawer_sessions")
    logger.info("drawer_sessions -> v2.access_sessions: %s rows", count)
    
    if report:
        report.add_operation(create_migration_operation(
            OperationType.TABLE_MIGRATE,
            source_table="drawer_sessions",
            target_table="v2.access_sessions",
            source_row_count=count,
            status="would_execute" if (dry_run and available) else ("pending" if available else "skipped"),
            description=(f"Migrating {count} access sessions" if available else "Skipped: source table missing"),
        ))
    
    if dry_run or not available:
        return
    db.execute(text("DELETE FROM v2.access_sessions"))
    db.execute(text(
        """
        INSERT INTO v2.access_sessions (id, user_id, unit_id, opened_at, closed_at, status, created_at, updated_at)
        SELECT ds.id,
               u.id,
               ds.drawer_id,
               ds.started_at,
               ds.closed_at,
               CASE WHEN ds.closed_at IS NULL THEN 'open' ELSE 'closed' END,
               ds.started_at,
               COALESCE(ds.closed_at, ds.started_at)
        FROM public.drawer_sessions ds
        JOIN v2.users u ON u.nfc_card_uid = ds.user_uid
        """
    ))


def migrate_observations(db, dry_run: bool):
    count, available = count_rows(db, "detection_events")
    logger.info("detection_events -> v2.observations/v2.vision_observation_details: %s rows", count)
    
    if report:
        report.add_operation(create_migration_operation(
            OperationType.TABLE_MIGRATE,
            source_table="detection_events",
            target_table="v2.observations + v2.vision_observation_details",
            source_row_count=count,
            status="would_execute" if (dry_run and available) else ("pending" if available else "skipped"),
            description=(f"Migrating {count} observation records" if available else "Skipped: source table missing"),
        ))
    
    if dry_run or not available:
        return
    db.execute(text("DELETE FROM v2.vision_observation_details"))
    db.execute(text("DELETE FROM v2.rfid_observation_details"))
    db.execute(text("DELETE FROM v2.observations"))
    db.execute(text(
        """
        INSERT INTO v2.observations (
            id, session_id, location_id, source_type, change_type, confidence, review_status, review_note, observed_at, created_at
        )
        SELECT id,
               session_id,
               slot_id,
               'vision',
               change_type,
               similarity_score,
               'normal',
               NULL,
               detected_at,
               detected_at
        FROM public.detection_events
        """
    ))
    db.execute(text(
        """
        INSERT INTO v2.vision_observation_details (
            observation_id, before_image_url, after_image_url, crop_url, model_version, raw_predictions_json, created_at
        )
        SELECT de.id,
               before_snapshot.image_url,
               after_snapshot.image_url,
               de.crop_image_url,
               NULL,
               CASE
                   WHEN de.raw_predictions IS NULL OR de.raw_predictions = '' THEN NULL
                   ELSE de.raw_predictions::jsonb
               END,
               de.detected_at
        FROM public.detection_events de
        LEFT JOIN public.drawer_snapshots before_snapshot ON before_snapshot.id = de.before_snapshot_id
        LEFT JOIN public.drawer_snapshots after_snapshot ON after_snapshot.id = de.after_snapshot_id
        """
    ))


def migrate_inventory_events(db, dry_run: bool):
    count, available = count_rows(db, "inventory_events")
    logger.info("inventory_events -> v2.inventory_events: %s rows", count)
    
    if report:
        report.add_operation(create_migration_operation(
            OperationType.TABLE_MIGRATE,
            source_table="inventory_events",
            target_table="v2.inventory_events",
            source_row_count=count,
            status="would_execute" if (dry_run and available) else ("pending" if available else "skipped"),
            description=(f"Migrating {count} inventory events" if available else "Skipped: source table missing"),
        ))
    
    if dry_run or not available:
        return
    db.execute(text("DELETE FROM v2.inventory_events"))
    db.execute(text(
        """
        INSERT INTO v2.inventory_events (
            id, session_id, user_id, item_type_id, event_type, quantity, location_id, observation_id, note, created_at
        )
        SELECT ie.id,
               ie.session_id,
               u.id,
               ie.item_type_id,
               ie.event_type,
               ie.quantity,
               ie.slot_id,
               ie.detection_event_id,
               ie.notes,
               ie.created_at
        FROM public.inventory_events ie
        JOIN v2.users u ON u.nfc_card_uid = ie.user_uid
        """
    ))


def migrate_audit_logs(db, dry_run: bool):
    count, available = count_rows(db, "audit_logs")
    logger.info("audit_logs -> v2.audit_logs: %s rows", count)
    
    if report:
        report.add_operation(create_migration_operation(
            OperationType.TABLE_MIGRATE,
            source_table="audit_logs",
            target_table="v2.audit_logs",
            source_row_count=count,
            status="would_execute" if (dry_run and available) else ("pending" if available else "skipped"),
            description=(f"Migrating {count} audit log entries" if available else "Skipped: source table missing"),
        ))
    
    if dry_run or not available:
        return
    db.execute(text("DELETE FROM v2.audit_logs"))
    db.execute(text(
        """
        INSERT INTO v2.audit_logs (id, ts, actor_type, actor_id, action, target_type, target_id, result, ip_address, message, correlation_id)
        SELECT id,
               timestamp,
               CASE WHEN "user" = 'admin' THEN 'admin' ELSE 'user' END,
               "user",
               type,
               CASE WHEN item IS NULL THEN NULL ELSE 'item' END,
               item,
               status,
               ip_address,
               message,
               NULL
        FROM public.audit_logs
        """
    ))


def migrate_slot_occupancies(db, dry_run: bool):
    count, available = count_rows(db, "slot_occupancies")
    logger.info("slot_occupancies -> v2.slot_occupancies: %s rows", count)
    
    if report:
        report.add_operation(create_migration_operation(
            OperationType.TABLE_MIGRATE,
            source_table="slot_occupancies",
            target_table="v2.slot_occupancies",
            source_row_count=count,
            status="would_execute" if (dry_run and available) else ("pending" if available else "skipped"),
            description=(f"Migrating {count} slot occupancy records" if available else "Skipped: source table missing"),
        ))
    
    if dry_run or not available:
        return
    db.execute(text("DELETE FROM v2.slot_occupancies"))
    db.execute(text(
        """
        INSERT INTO v2.slot_occupancies (location_id, state, item_type_id, confidence, last_event_id, updated_at)
        SELECT slot_id, state, item_type_id, confidence, NULL, updated_at
        FROM public.slot_occupancies
        """
    ))


def sync_sequences(db):
    for table in [
        "users",
        "item_types",
        "item_type_images",
        "storage_units",
        "storage_locations",
        "access_sessions",
        "observations",
        "inventory_events",
        "audit_logs",
    ]:
        db.execute(text(
            f"SELECT setval(pg_get_serial_sequence('v2.{table}', 'id'), COALESCE((SELECT MAX(id) FROM v2.{table}), 1), true)"
        ))


def main():
    global report
    
    parser = argparse.ArgumentParser(description="Shadow migrate public schema into v2 schema")
    parser.add_argument("--dry-run", action="store_true", help="Preview row counts only")
    parser.add_argument("--execute", action="store_true", help="Create v2 schema and migrate data")
    parser.add_argument("--report", type=str, default="", help="Save dry-run report to file (format: ascii, json, markdown)")
    args = parser.parse_args()

    if not args.dry_run and not args.execute:
        parser.error("Choose either --dry-run or --execute")

    # Initialize report
    report = DryRunReport(
        script_name="migrate_to_v2.py",
        database_url=DATABASE_URL,
    )

    db = SessionLocal()
    try:
        logger.info("Starting shadow migration (dry_run=%s)", args.dry_run)
        apply_shadow_schema(dry_run=args.dry_run)
        migrate_users(db, dry_run=args.dry_run)
        migrate_item_types(db, dry_run=args.dry_run)
        migrate_storage(db, dry_run=args.dry_run)
        migrate_sessions(db, dry_run=args.dry_run)
        migrate_observations(db, dry_run=args.dry_run)
        migrate_inventory_events(db, dry_run=args.dry_run)
        migrate_audit_logs(db, dry_run=args.dry_run)
        migrate_slot_occupancies(db, dry_run=args.dry_run)
        if args.execute:
            sync_sequences(db)
            db.commit()
        logger.info("Shadow migration completed successfully")
        
        # Print and save report if dry-run
        if args.dry_run:
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
                
    except Exception as exc:
        db.rollback()
        if report:
            report.add_error(str(exc))
            if args.dry_run:
                report.print_ascii()
                if args.report:
                    format_map = {"json": "json", "md": "markdown", "txt": "ascii"}
                    fmt = "ascii"
                    for ext, fmt_type in format_map.items():
                        if args.report.endswith(f".{ext}"):
                            fmt = fmt_type
                            break
                    report.save_report(args.report, format=fmt)
        logger.exception("Shadow migration failed")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
