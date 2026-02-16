"""Create a default admin user. Run once after DB reset."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, init_db
from app.models.user import User
from app.auth import hash_password

init_db()
db = SessionLocal()

EMAIL = "admin@inventory.local"
PASSWORD = "admin123"

existing = db.query(User).filter(User.email == EMAIL).first()
if existing:
    print(f"Admin user already exists (uid={existing.uid})")
else:
    admin = User(
        uid="ADMIN001",
        name="Administrator",
        email=EMAIL,
        role="admin",
        password_hash=hash_password(PASSWORD),
        authorized=True,
    )
    db.add(admin)
    db.commit()
    print(f"✅ Admin user created!")
    print(f"   Email:    {EMAIL}")
    print(f"   Password: {PASSWORD}")

db.close()
