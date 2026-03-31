"""
Migration script to add nfc_card_uid column to users table if it doesn't exist.
This handles the case where the database schema is out of sync with the ORM model.
"""

import sqlite3
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import DATABASE_URL


def migrate():
    """Add nfc_card_uid column to users table"""
    
    # Only works with SQLite
    if not DATABASE_URL.startswith("sqlite"):
        print(f"This migration only works with SQLite. Current: {DATABASE_URL}")
        return False
    
    # Extract database path
    db_path = DATABASE_URL.replace("sqlite:///", "")
    db_path = Path(backend_dir) / db_path
    
    print(f"Migrating database: {db_path}")
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if nfc_card_uid column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = {row[1] for row in cursor.fetchall()}
        
        if "nfc_card_uid" in columns:
            print("✓ nfc_card_uid column already exists")
            conn.close()
            return True
        
        if "uid" not in columns:
            print("✗ Neither nfc_card_uid nor uid column found. Database schema is invalid.")
            conn.close()
            return False
        
        print("Adding nfc_card_uid column...")
        
        # Add nfc_card_uid as a copy of uid
        cursor.execute("""
            ALTER TABLE users 
            ADD COLUMN nfc_card_uid VARCHAR(255)
        """)
        
        # Populate nfc_card_uid from uid if uid exists
        cursor.execute("UPDATE users SET nfc_card_uid = uid WHERE uid IS NOT NULL")
        
        # For any rows without uid, generate a temporary unique value
        cursor.execute("""
            UPDATE users 
            SET nfc_card_uid = 'TEMP_' || id 
            WHERE nfc_card_uid IS NULL
        """)
        
        # Make nfc_card_uid NOT NULL and UNIQUE
        cursor.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nfc_card_uid 
            ON users(nfc_card_uid)
        """)
        
        conn.commit()
        print("✓ Migration completed successfully")
        print(f"  - Added nfc_card_uid column")
        print(f"  - Created unique index on nfc_card_uid")
        
        conn.close()
        return True
        
    except sqlite3.OperationalError as e:
        print(f"✗ Database error: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False


if __name__ == "__main__":
    success = migrate()
    sys.exit(0 if success else 1)
