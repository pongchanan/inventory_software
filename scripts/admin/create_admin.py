from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.auth import hash_password
from app.database import SessionLocal, init_db
from app.models.user import User

def create_admin():
    db = SessionLocal()
    init_db()
    
    admin_email = "admin@example.com"
    admin_password = "admin123"
    admin_uid = "ADMIN001"
    
    # Check if admin exists by email or UID
    admin = db.query(User).filter(
        (User.email == admin_email) | (User.uid == admin_uid)
    ).first()
    
    if not admin:
        print(f"Creating admin user: {admin_email}")
        admin = User(
            uid=admin_uid,
            name="System Admin",
            email=admin_email,
            password_hash=hash_password(admin_password),
            role="admin",
            authorized=True
        )
        db.add(admin)
        db.commit()
        print("✅ Admin created successfully!")
    else:
        print(f"Admin user already exists (UID: {admin.uid}, Email: {admin.email})")
        print("Updating password and ensuring admin role...")
        admin.password_hash = hash_password(admin_password)
        admin.role = "admin"
        admin.authorized = True
        db.commit()
        print("✅ Admin password and role updated!")
    
    print(f"\nLogin Details:")
    print(f"Email: {admin.email}")
    print(f"Password: {admin_password}")
    
    db.close()

if __name__ == "__main__":
    create_admin()
