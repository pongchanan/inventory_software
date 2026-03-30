"""
Create an admin user for testing
"""

import sqlite3
from pathlib import Path
from datetime import datetime

backend_dir = Path(__file__).parent.parent
db_path = backend_dir / "inventory.db"

# For password hashing
import hashlib
import secrets

def hash_password(password: str) -> str:
    """Hash password with salt using PBKDF2"""
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}${pwd_hash.hex()}"

def create_admin_user():
    """Create an admin user"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if admin user already exists
    cursor.execute("SELECT * FROM users WHERE email = ?", ("admin@inventory.local",))
    existing = cursor.fetchone()
    
    if existing:
        print("✓ Admin user already exists")
        print(f"  Email: admin@inventory.local")
        print(f"  NFC UID: {existing[10]}")  # nfc_card_uid is the last column
        conn.close()
        return
    
    try:
        # Create admin user
        uid = "ADMIN_DEFAULT_001"
        email = "admin@inventory.local"
        name = "admin"
        role = "admin"
        password = "admin123456"  # Default password - CHANGE THIS!
        password_hash = hash_password(password)
        now = datetime.utcnow().isoformat()
        
        cursor.execute("""
            INSERT INTO users 
            (nfc_card_uid, uid, name, email, role, password_hash, authorized, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (uid, uid, name, email, role, password_hash, True, True, now, now))
        
        conn.commit()
        print("✓ Admin user created successfully")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        print(f"  NFC UID: {uid}")
        print("\n⚠️  IMPORTANT: Change the password after first login!")
        
    except sqlite3.IntegrityError as e:
        print(f"✗ Error creating admin user: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    create_admin_user()
