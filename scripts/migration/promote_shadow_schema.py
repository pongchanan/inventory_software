"""Promote the shadow schema into public and archive the old public tables."""

from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parents[2]

load_dotenv(ROOT_DIR / ".env", override=True)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./inventory.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

LEGACY_TABLES = [
    "approvals",
    "audit_logs",
    "compartments",
    "detection_events",
    "drawer_sessions",
    "drawer_slots",
    "drawer_snapshots",
    "drawers",
    "exception_cases",
    "inventory_events",
    "item_type_images",
    "item_types",
    "items",
    "loans",
    "slot_occupancies",
    "transactions",
    "users",
]

SHADOW_TABLES = [
    "users",
    "item_types",
    "item_type_images",
    "storage_units",
    "storage_locations",
    "access_sessions",
    "observations",
    "rfid_observation_details",
    "vision_observation_details",
    "inventory_events",
    "audit_logs",
    "slot_occupancies",
]


def legacy_name(name: str) -> str:
    candidate = f"legacy_{name}"
    return candidate[:63]


def table_exists(conn, schema_name: str, table_name: str) -> bool:
    return bool(
        conn.execute(
            text(
                """
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = :schema_name AND table_name = :table_name
                LIMIT 1
                """
            ),
            {"schema_name": schema_name, "table_name": table_name},
        ).scalar()
    )


def ensure_auth_columns(conn):
    logger.info("Ensuring shadow users table has auth columns")
    conn.execute(text("ALTER TABLE v2.users ADD COLUMN IF NOT EXISTS email VARCHAR(255)"))
    conn.execute(text("ALTER TABLE v2.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)"))
    conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_v2_users_email ON v2.users(email)"))
    conn.execute(
        text(
            """
            UPDATE v2.users AS target
            SET email = source.email,
                password_hash = source.password_hash
            FROM public.users AS source
            WHERE source.id = target.id
            """
        )
    )


def rename_archived_objects(conn, legacy_table_name: str):
    constraint_names = conn.execute(
        text(
            """
            SELECT conname
            FROM pg_constraint
            WHERE connamespace = 'public'::regnamespace
              AND conrelid = (:regclass_name)::regclass
            """
        ),
        {"regclass_name": f"public.{legacy_table_name}"},
    ).fetchall()
    for (constraint_name,) in constraint_names:
        new_name = legacy_name(constraint_name)
        if new_name != constraint_name:
            logger.info("Renaming constraint %s -> %s", constraint_name, new_name)
            conn.execute(
                text(f"ALTER TABLE public.{legacy_table_name} RENAME CONSTRAINT {constraint_name} TO {new_name}")
            )

    index_names = conn.execute(
        text(
            """
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public' AND tablename = :table_name
            """
        ),
        {"table_name": legacy_table_name},
    ).fetchall()
    for (index_name,) in index_names:
        new_name = legacy_name(index_name)
        if new_name != index_name:
            logger.info("Renaming index %s -> %s", index_name, new_name)
            conn.execute(text(f"ALTER INDEX public.{index_name} RENAME TO {new_name}"))

    sequence_names = conn.execute(
        text(
            """
            SELECT seq.relname
            FROM pg_class seq
            JOIN pg_depend dep ON dep.objid = seq.oid AND dep.deptype = 'a'
            JOIN pg_class tbl ON dep.refobjid = tbl.oid
            JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
            WHERE ns.nspname = 'public'
              AND tbl.relname = :table_name
              AND seq.relkind = 'S'
            """
        ),
        {"table_name": legacy_table_name},
    ).fetchall()
    for (sequence_name,) in sequence_names:
        new_name = legacy_name(sequence_name)
        if new_name != sequence_name:
            logger.info("Renaming sequence %s -> %s", sequence_name, new_name)
            conn.execute(text(f"ALTER SEQUENCE public.{sequence_name} RENAME TO {new_name}"))


def archive_public_tables(conn):
    for table_name in LEGACY_TABLES:
        legacy_name = f"legacy_{table_name}"
        if table_exists(conn, "public", table_name):
            if table_exists(conn, "public", legacy_name):
                raise RuntimeError(f"Refusing to overwrite existing archived table public.{legacy_name}")
            logger.info("Archiving public.%s -> public.%s", table_name, legacy_name)
            conn.execute(text(f"ALTER TABLE public.{table_name} RENAME TO {legacy_name}"))
            rename_archived_objects(conn, legacy_name)


def promote_shadow_tables(conn):
    for table_name in SHADOW_TABLES:
        if not table_exists(conn, "v2", table_name):
            raise RuntimeError(f"Expected shadow table v2.{table_name} to exist")
        logger.info("Promoting v2.%s -> public.%s", table_name, table_name)
        conn.execute(text(f"ALTER TABLE v2.{table_name} SET SCHEMA public"))


def drop_shadow_schema(conn):
    if conn.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'v2'")) .scalar() == 0:
        logger.info("Dropping empty shadow schema v2")
        conn.execute(text("DROP SCHEMA IF EXISTS v2"))


def main():
    logger.info("Starting public cutover")
    with engine.begin() as conn:
        ensure_auth_columns(conn)
        archive_public_tables(conn)
        promote_shadow_tables(conn)
        drop_shadow_schema(conn)
    logger.info("Public cutover completed successfully")


if __name__ == "__main__":
    main()
