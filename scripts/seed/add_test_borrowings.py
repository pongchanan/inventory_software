"""Quick script to add test borrowing records for UI testing."""

import sys
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

load_dotenv(ROOT_DIR / ".env", override=False)

from app.models.user import User
from app.models.item import Item
from app.models.borrowing import Borrowing
from app.database import engine, SessionLocal

def add_test_borrowings():
    """Add test borrowing records to the first user"""
    db = SessionLocal()
    
    try:
        # Get first user
        user = db.query(User).first()
        if not user:
            print("❌ No users found. Please create a user first.")
            return
        
        print(f"📝 Adding test borrowing records for user: {user.name} (ID: {user.id})")
        
        # Create test items if they don't exist
        existing_items = db.query(Item).all()
        if len(existing_items) < 5:
            print(f"📦 Creating test items (found {len(existing_items)}, need 5)...")
            item_names = [
                "MacBook Pro 15\"",
                "iPad Air 5th Gen",
                "Sony WH-1000XM5 Headphones",
                "Logitech MX Master 3S Mouse",
                "USB-C Hub Adapter"
            ]
            for i, name in enumerate(item_names):
                if not db.query(Item).filter(Item.name == name).first():
                    item = Item(name=name, quantity=10, is_active=True)
                    db.add(item)
                    print(f"  ✅ Created: {name}")
            db.commit()
        
        # Get items
        items = db.query(Item).limit(5).all()
        if not items:
            print("❌ Failed to create items.")
            return
        
        print(f"📌 Found {len(items)} items for borrowing records")
        
        now = datetime.utcnow()
        borrowing_records = [
            {
                "item": items[0],
                "borrow_at": now - timedelta(days=15),
                "due_at": now - timedelta(days=8),
                "return_at": now - timedelta(days=7),
                "status": "Returned"
            },
            {
                "item": items[1] if len(items) > 1 else items[0],
                "borrow_at": now - timedelta(days=10),
                "due_at": now - timedelta(days=3),
                "return_at": now - timedelta(days=1),
                "status": "Returned"
            },
            {
                "item": items[2] if len(items) > 2 else items[0],
                "borrow_at": now - timedelta(days=5),
                "due_at": now + timedelta(days=2),
                "return_at": None,
                "status": "Active"
            },
            {
                "item": items[3] if len(items) > 3 else items[0],
                "borrow_at": now - timedelta(days=3),
                "due_at": now + timedelta(days=4),
                "return_at": None,
                "status": "Active"
            },
            {
                "item": items[4] if len(items) > 4 else items[0],
                "borrow_at": now - timedelta(days=1),
                "due_at": now + timedelta(days=6),
                "return_at": None,
                "status": "Active"
            },
        ]
        
        # Clear existing borrowings for this user
        existing_borrowings = db.query(Borrowing).filter(Borrowing.user_id == user.id).all()
        for b in existing_borrowings:
            db.delete(b)
        db.commit()
        print("🗑️  Cleared existing borrowing records")
        
        for record in borrowing_records:
            borrowing = Borrowing(
                item_id=record["item"].id,
                user_id=user.id,
                borrow_at=record["borrow_at"],
                due_at=record["due_at"],
                return_at=record["return_at"],
            )
            db.add(borrowing)
            item_name = record["item"].name if hasattr(record["item"], 'name') else f'Item #{record["item"].id}'
            print(f"  ✅ {record['status']}: {item_name}")
        
        db.commit()
        print(f"\n✨ Added {len(borrowing_records)} test borrowing records!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    add_test_borrowings()
