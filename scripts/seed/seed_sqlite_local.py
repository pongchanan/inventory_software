"""
Seed: seed_sqlite_local
------------------------
Seeds local SQLite database with practical development data.

What this script does:
  1) Forces DATABASE_URL to sqlite:///./inventory.db
  2) Creates/updates base schema
  3) Seeds item types, drawers, and slots
  4) Ensures a default admin account exists
  5) Seeds sample loans/audit activity

Usage (from backend/):
    python scripts/seed/seed_sqlite_local.py
"""

import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"

# Allow imports from backend/app and sibling scripts package.
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(ROOT_DIR))

from dotenv import load_dotenv

load_dotenv(ROOT_DIR / ".env", override=True)
os.environ["DATABASE_URL"] = "sqlite:///./inventory.db"

import app.models  # noqa: F401
from app.database import Base, SessionLocal, engine
from app.models.user import User
from scripts.seed.seed_drawers import run as seed_drawers
from create_sample_tracking_data import create_sample_data


def ensure_local_admin():
    """Create/update a local admin record without password hashing dependency."""
    db = SessionLocal()
    try:
        admin_email = "admin@example.com"
        admin_uid = "ADMIN001"

        admin = db.query(User).filter(
            (User.email == admin_email) | (User.uid == admin_uid)
        ).first()

        if not admin:
            admin = User(
                uid=admin_uid,
                name="System Admin",
                email=admin_email,
                role="admin",
                authorized=True,
            )
            db.add(admin)
            db.commit()
            print("Created local admin record: admin@example.com")
        else:
            admin.role = "admin"
            admin.authorized = True
            db.commit()
            print("Updated existing admin record: admin@example.com")
    finally:
        db.close()


def run_seed():
    print("=" * 60)
    print("Seed: seed_sqlite_local")
    print("=" * 60)
    print(f"Database: {engine.url}\n")

    print("Ensuring schema exists...")
    Base.metadata.create_all(bind=engine)

    print("\nSeeding item types/drawers/slots...")
    seed_drawers()

    print("\nEnsuring admin account...")
    ensure_local_admin()

    print("\nSeeding sample tracking data...")
    create_sample_data()

    print("\n✅ SQLite seed complete.")


if __name__ == "__main__":
    run_seed()
