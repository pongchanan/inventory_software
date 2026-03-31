"""
Create a superuser account with bcrypt password hashing
Usage: python scripts/create_superuser.py
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal, engine
from app.models.user import User
from app.auth import hash_password
from sqlalchemy.exc import IntegrityError
import uuid
from datetime import datetime


def create_superuser(email: str, password: str, name: str = "Power User"):
    """Create a superuser account"""
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"❌ User with email '{email}' already exists!")
            print(f"   NFC UID: {existing_user.nfc_card_uid}")
            print(f"   Role: {existing_user.role}")
            db.close()
            return False
        
        # Create new superuser
        nfc_uid = str(uuid.uuid4())
        password_hash = hash_password(password)
        
        new_user = User(
            nfc_card_uid=nfc_uid,
            name=name,
            email=email,
            role="admin",
            password_hash=password_hash,
            active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print("✅ Superuser created successfully!")
        print(f"   Email: {email}")
        print(f"   Name: {name}")
        print(f"   Role: admin")
        print(f"   NFC UID: {nfc_uid}")
        
        db.close()
        return True
        
    except IntegrityError as e:
        db.rollback()
        print(f"❌ Error: User with this email already exists")
        db.close()
        return False
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating superuser: {e}")
        db.close()
        return False


if __name__ == "__main__":
    # Create superuser with the specified credentials
    create_superuser(
        email="poweruser@gmail.com",
        password="poweruser",
        name="Power User"
    )
