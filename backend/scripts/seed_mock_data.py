"""
Seed mock data for testing dashboard, graphs, and exports.
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Use local SQLite database for testing
os.environ["DATABASE_URL"] = "sqlite:///./test_inventory.db"

from app.database import SessionLocal, init_db, engine, Base
from app.models.user import User
from app.models.item_type_core import ItemType
from app.models.storage_unit_core import StorageUnit
from app.models.storage_location_core import StorageLocation
from app.models.access_session_core import AccessSession
from app.models.inventory_event_core import InventoryEvent


def seed_database():
    """Seed the database with mock data"""
    db = SessionLocal()
    
    try:
        # Initialize database tables (creates all tables from models)
        print("Initializing database schema...")
        Base.metadata.create_all(bind=engine)
        print("✓ Database schema initialized\n")
        
        # Clear existing data (optional - comment out to preserve)
        print("Clearing existing data...")
        db.query(InventoryEvent).delete()
        db.query(AccessSession).delete()
        db.query(StorageLocation).delete()
        db.query(StorageUnit).delete()
        db.query(ItemType).delete()
        db.query(User).delete()
        db.commit()
        
        print("✓ Cleared existing data\n")
        
        # 1. Create Users
        print("Creating users...")
        users = [
            User(
                nfc_card_uid=f"NFC{1000 + i:04d}",
                name=f"User {i+1}",
                email=f"user{i+1}@example.com",
                role="user",
                active=True
            )
            for i in range(5)
        ]
        # Add admin
        admin = User(
            nfc_card_uid="ADMIN001",
            name="Admin User",
            email="admin@example.com",
            role="admin",
            active=True
        )
        users.append(admin)
        db.add_all(users)
        db.commit()
        print(f"✓ Created {len(users)} users\n")
        
        # 2. Create Item Types
        print("Creating item types...")
        items = [
            ItemType(name="Oscilloscope", active=True),
            ItemType(name="Multimeter", active=True),
            ItemType(name="Power Supply", active=True),
            ItemType(name="Function Generator", active=True),
            ItemType(name="Logic Analyzer", active=True),
            ItemType(name="Soldering Iron", active=True),
            ItemType(name="Breadboard", active=True),
        ]
        db.add_all(items)
        db.commit()
        print(f"✓ Created {len(items)} item types\n")
        
        # 3. Create Storage Units and Locations
        print("Creating storage units and locations...")
        units = [
            StorageUnit(unit_type="drawer", layout_type="grid", active=True),
            StorageUnit(unit_type="shelf", layout_type="zone", active=True),
            StorageUnit(unit_type="hanger_cabinet", layout_type="none", active=True),
        ]
        db.add_all(units)
        db.commit()
        
        # Create storage locations
        locations = []
        for unit in units:
            for level in range(1, 3):
                for row in range(1, 4):
                    for col in range(1, 4):
                        location = StorageLocation(
                            unit_id=unit.id,
                            level_no=level,
                            row_no=row,
                            col_no=col,
                            active=True
                        )
                        locations.append(location)
        db.add_all(locations)
        db.commit()
        print(f"✓ Created {len(units)} storage units and {len(locations)} locations\n")
        
        # 4. Create Access Sessions and Inventory Events (borrow/return history)
        print("Creating access sessions and inventory events...")
        
        # These borrow counts will make the graphs show different items with different frequencies
        borrow_counts = {
            1: 12,  # Oscilloscope - most borrowed
            2: 8,   # Multimeter
            3: 6,   # Power Supply
            4: 4,   # Function Generator
            5: 3,   # Logic Analyzer
            6: 2,   # Soldering Iron
            7: 1,   # Breadboard - least borrowed
        }
        
        base_date = datetime.utcnow() - timedelta(days=30)
        event_count = 0
        
        for item_type_id, borrow_count in borrow_counts.items():
            for borrow_num in range(borrow_count):
                # Vary dates across last 30 days
                borrow_date = base_date + timedelta(
                    days=random.randint(0, 29),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )
                return_date = borrow_date + timedelta(
                    hours=random.randint(1, 48)
                )
                
                # Pick random user and unit
                user = random.choice(users[:-1])  # Exclude admin
                unit = random.choice(units)
                location = random.choice(locations)
                
                # Create access session
                session = AccessSession(
                    user_id=user.id,
                    unit_id=unit.id,
                    opened_at=borrow_date,
                    closed_at=return_date,
                    status="closed"
                )
                db.add(session)
                db.flush()
                
                # Create borrow event
                borrow_event = InventoryEvent(
                    session_id=session.id,
                    user_id=user.id,
                    item_type_id=item_type_id,
                    event_type="borrow",
                    quantity=1,
                    location_id=location.id,
                    created_at=borrow_date
                )
                db.add(borrow_event)
                event_count += 1
                
                # Create return event
                return_event = InventoryEvent(
                    session_id=session.id,
                    user_id=user.id,
                    item_type_id=item_type_id,
                    event_type="return",
                    quantity=1,
                    location_id=location.id,
                    created_at=return_date
                )
                db.add(return_event)
                event_count += 1
        
        db.commit()
        print(f"✓ Created inventory events (total: {event_count})\n")
        
        # 5. Add a few "borrowed" items (not yet returned)
        print("Creating active/overdue loans...")
        now = datetime.utcnow()
        for user in users[:-1]:  # Exclude admin
            if random.random() > 0.5:
                unit = random.choice(units)
                item_type = random.choice(items)
                location = random.choice(locations)
                
                # Create session
                session = AccessSession(
                    user_id=user.id,
                    unit_id=unit.id,
                    opened_at=now - timedelta(days=random.randint(1, 14)),
                    closed_at=None,
                    status="open"
                )
                db.add(session)
                db.flush()
                
                # Create active borrow event
                borrow_event = InventoryEvent(
                    session_id=session.id,
                    user_id=user.id,
                    item_type_id=item_type.id,
                    event_type="borrow",
                    quantity=1,
                    location_id=location.id,
                    created_at=session.opened_at
                )
                db.add(borrow_event)
        
        db.commit()
        print("✓ Created active/overdue loans\n")
        
        print("=" * 50)
        print("✓ MOCK DATA SEEDING COMPLETE!")
        print("=" * 50)
        print(f"\nSummary:")
        print(f"  • Users: {len(users)}")
        print(f"  • Item Types: {len(items)}")
        print(f"  • Storage Units: {len(units)}")
        print(f"  • Storage Locations: {len(locations)}")
        print(f"  • Inventory Events: {event_count}")
        print(f"\nYou can now:")
        print(f"  • Test the admin dashboard graphs")
        print(f"  • Export data to Excel")
        print(f"  • View borrow history in the logs")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
