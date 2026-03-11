"""
Seed script to populate database with sample data for testing
Run this after starting the server for the first time
"""
import requests
import json

BASE_URL = "http://localhost:3000"

# Sample Users
users = [
    {
        "uid": "A1B2C3D4",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "authorized": True
    },
    {
        "uid": "E5F6G7H8",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "admin",
        "authorized": True
    },
    {
        "uid": "I9J0K1L2",
        "name": "Bob Wilson",
        "email": "bob@example.com",
        "role": "user",
        "authorized": False
    }
]

# Sample Items
items = [
    {
        "uid": "ITEM001",
        "name": "Screwdriver Set",
        "description": "Phillips and flathead set",
        "category": "Tools",
        "quantity": 1,
        "available": True,
        "location": "Cabinet A, Shelf 1"
    },
    {
        "uid": "ITEM002",
        "name": "Multimeter",
        "description": "Digital multimeter",
        "category": "Electronics",
        "quantity": 1,
        "available": True,
        "location": "Cabinet A, Shelf 2"
    },
    {
        "uid": "ITEM003",
        "name": "Soldering Iron",
        "description": "60W soldering iron",
        "category": "Electronics",
        "quantity": 1,
        "available": False,
        "location": "Cabinet B, Shelf 1"
    }
]


def seed_data():
    print("🌱 Seeding database with sample data...\n")
    
    # Add users
    print("Adding users...")
    for user in users:
        try:
            response = requests.post(f"{BASE_URL}/api/users/", json=user)
            if response.status_code == 201:
                print(f"✅ Created user: {user['name']} (UID: {user['uid']})")
            else:
                print(f"⚠️  User {user['name']}: {response.json()}")
        except Exception as e:
            print(f"❌ Error creating user {user['name']}: {e}")
    
    print()
    
    # Add item types
    print("Adding item types...")
    for item in items:
        try:
            response = requests.post(
                f"{BASE_URL}/api/item-types",
                json={"name": item["name"]},
            )
            if response.status_code == 201:
                print(f"✅ Created item type: {item['name']}")
            else:
                print(f"⚠️  Item type {item['name']}: {response.json()}")
        except Exception as e:
            print(f"❌ Error creating item type {item['name']}: {e}")
    
    print("\n✅ Seeding complete!")
    print(f"\n📝 Test the API at: {BASE_URL}/docs")


if __name__ == "__main__":
    seed_data()
