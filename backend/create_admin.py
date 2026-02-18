from app.database import SessionLocal, init_db
from app.models.user import User
from app.auth import hash_password

def create_admin():
    db = SessionLocal()
    init_db()
    
    admin_email = "admin@example.com"
    admin_password = "adminpassword123"
    
    admin = db.query(User).filter(User.email == admin_email).first()
    if not admin:
        print(f"Creating admin user: {admin_email}")
        admin = User(
            uid="ADMIN001",
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
        print(f"Admin {admin_email} already exists. Updating password...")
        admin.password_hash = hash_password(admin_password)
        db.commit()
        print("✅ Admin password updated!")
    
    print(f"\nLogin Details:")
    print(f"Email: {admin_email}")
    print(f"Password: {admin_password}")
    
    db.close()

if __name__ == "__main__":
    create_admin()
