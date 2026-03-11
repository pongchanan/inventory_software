"""
Create sample loan and audit log data to demonstrate the admin tracking features
"""
from datetime import datetime, timedelta
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal, init_db
from app.models.audit_log import AuditLog
from app.models.item import Item
from app.models.loan import Loan
from app.models.user import User

def create_sample_data():
    init_db()
    db = SessionLocal()
    
    try:
        # Get existing users and items
        users = db.query(User).all()
        items = db.query(Item).all()
        
        if not users:
            print("⚠️  No users found. Creating sample users...")
            # Create sample users
            sample_users = [
                User(uid="NFC001", name="Alice Johnson", email="alice@example.com", role="user", authorized=True),
                User(uid="NFC002", name="Bob Smith", email="bob@example.com", role="user", authorized=True),
                User(uid="NFC003", name="Charlie Brown", email="charlie@example.com", role="user", authorized=True),
            ]
            for user in sample_users:
                db.add(user)
            db.commit()
            users = sample_users
        
        if not items:
            print("⚠️  No items found. Creating sample items...")
            # Create sample items
            sample_items = [
                Item(uid="RFID001", name="Arduino Uno Kit", category="Electronics", quantity=1, available=False, location="A1-001"),
                Item(uid="RFID002", name="Raspberry Pi 4", category="Electronics", quantity=1, available=False, location="A1-002"),
                Item(uid="RFID003", name="Digital Multimeter", category="Tools", quantity=1, available=True, location="B2-015"),
            ]
            for item in sample_items:
                db.add(item)
            db.commit()
            items = sample_items
        
        print(f"✓ Found {len(users)} users and {len(items)} items")
        
        # Create sample loans
        print("\n📦 Creating sample loan records...")
        
        now = datetime.utcnow()
        
        loans_data = [
            # Active loan - borrowed 2 days ago, due in 5 days
            {
                "user_uid": users[0].uid,
                "item_uid": items[0].uid if len(items) > 0 else "RFID001",
                "borrowed_at": now - timedelta(days=2),
                "due_at": now + timedelta(days=5),
                "status": "active",
                "returned_at": None
            },
            # Overdue loan - borrowed 10 days ago, was due 3 days ago
            {
                "user_uid": users[1].uid if len(users) > 1 else users[0].uid,
                "item_uid": items[1].uid if len(items) > 1 else "RFID002",
                "borrowed_at": now - timedelta(days=10),
                "due_at": now - timedelta(days=3),
                "status": "overdue",
                "returned_at": None
            },
            # Returned loan - borrowed 20 days ago, returned 15 days ago
            {
                "user_uid": users[2].uid if len(users) > 2 else users[0].uid,
                "item_uid": items[2].uid if len(items) > 2 else "RFID003",
                "borrowed_at": now - timedelta(days=20),
                "due_at": now - timedelta(days=13),
                "status": "returned",
                "returned_at": now - timedelta(days=15)
            },
            # Another returned loan
            {
                "user_uid": users[0].uid,
                "item_uid": items[2].uid if len(items) > 2 else "RFID003",
                "borrowed_at": now - timedelta(days=30),
                "due_at": now - timedelta(days=23),
                "status": "returned",
                "returned_at": now - timedelta(days=25)
            },
        ]
        
        for loan_data in loans_data:
            # Check if loan already exists
            existing = db.query(Loan).filter(
                Loan.user_uid == loan_data["user_uid"],
                Loan.item_uid == loan_data["item_uid"],
                Loan.borrowed_at == loan_data["borrowed_at"]
            ).first()
            
            if not existing:
                loan = Loan(**loan_data)
                db.add(loan)
                print(f"  ✓ Created loan: {loan_data['user_uid']} borrowed {loan_data['item_uid']} ({loan_data['status']})")
        
        db.commit()
        
        # Create sample audit logs (cabinet access)
        print("\n🔐 Creating sample cabinet access logs...")
        
        audit_logs_data = [
            # Recent unlocks
            {
                "timestamp": now - timedelta(hours=2),
                "type": "unlock",
                "user": users[0].uid,
                "item": items[0].uid if len(items) > 0 else "RFID001",
                "status": "success",
                "message": "Cabinet A1-001 unlocked successfully"
            },
            {
                "timestamp": now - timedelta(hours=5),
                "type": "scan",
                "user": users[1].uid if len(users) > 1 else users[0].uid,
                "item": items[1].uid if len(items) > 1 else "RFID002",
                "status": "success",
                "message": "Item scanned for checkout"
            },
            {
                "timestamp": now - timedelta(hours=8),
                "type": "lock",
                "user": users[0].uid,
                "item": None,
                "status": "success",
                "message": "Cabinet A1-001 locked"
            },
            # Yesterday's activities
            {
                "timestamp": now - timedelta(days=1, hours=3),
                "type": "unlock",
                "user": users[2].uid if len(users) > 2 else users[0].uid,
                "item": items[2].uid if len(items) > 2 else "RFID003",
                "status": "success",
                "message": "Cabinet B2-015 unlocked"
            },
            {
                "timestamp": now - timedelta(days=1, hours=10),
                "type": "scan",
                "user": users[1].uid if len(users) > 1 else users[0].uid,
                "item": items[0].uid if len(items) > 0 else "RFID001",
                "status": "success",
                "message": "Item RFID verified"
            },
            # Failed access attempt
            {
                "timestamp": now - timedelta(hours=12),
                "type": "unlock",
                "user": "NFC999",
                "item": None,
                "status": "failed",
                "message": "Unauthorized user attempted access"
            },
            # Two days ago
            {
                "timestamp": now - timedelta(days=2, hours=4),
                "type": "unlock",
                "user": users[0].uid,
                "item": items[0].uid if len(items) > 0 else "RFID001",
                "status": "success",
                "message": "Cabinet opened for item borrowing"
            },
        ]
        
        for log_data in audit_logs_data:
            # Check if log already exists
            existing = db.query(AuditLog).filter(
                AuditLog.timestamp == log_data["timestamp"],
                AuditLog.user == log_data["user"],
                AuditLog.type == log_data["type"]
            ).first()
            
            if not existing:
                log = AuditLog(**log_data)
                db.add(log)
                print(f"  ✓ Created log: {log_data['type']} by {log_data['user']} ({log_data['status']})")
        
        db.commit()
        
        print("\n✅ Sample data created successfully!")
        print("\n📊 Summary:")
        print(f"  - Total loans: {db.query(Loan).count()}")
        print(f"  - Active loans: {db.query(Loan).filter(Loan.status == 'active').count()}")
        print(f"  - Overdue loans: {db.query(Loan).filter(Loan.status == 'overdue').count()}")
        print(f"  - Cabinet access logs: {db.query(AuditLog).filter(AuditLog.type.in_(['unlock', 'lock', 'scan'])).count()}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🎬 Creating sample tracking data...\n")
    create_sample_data()
    print("\n🎉 Done! Refresh your admin panel to see the data.")
