"""
Tests for item management functionality
"""
import pytest
from app.models.item import Item


class TestItemModel:
    """Test Item model"""
    
    def test_create_item(self, db_session):
        """Test creating an item"""
        item = Item(
            uid="TEST001",
            name="Test Item",
            description="Test Description",
            category="Test Category",
            quantity=10,
            available=True,
            location="Shelf A1"
        )
        db_session.add(item)
        db_session.commit()
        
        assert item.id is not None
        assert item.uid == "TEST001"
        assert item.name == "Test Item"
        assert item.quantity == 10
        assert item.available is True
    
    def test_item_defaults(self, db_session):
        """Test item default values"""
        item = Item(uid="TEST002", name="Minimal Item")
        db_session.add(item)
        db_session.commit()
        
        assert item.quantity == 1
        assert item.available is True
        assert item.created_at is not None
        assert item.updated_at is not None
    
    def test_item_unique_uid(self, db_session):
        """Test that UID must be unique"""
        item1 = Item(uid="DUPLICATE", name="Item 1")
        db_session.add(item1)
        db_session.commit()
        
        item2 = Item(uid="DUPLICATE", name="Item 2")
        db_session.add(item2)
        
        with pytest.raises(Exception):  # SQLAlchemy IntegrityError
            db_session.commit()


class TestItemEndpoints:
    """Test item API endpoints"""
    
    def test_create_item_as_admin(self, client, admin_token):
        """Test creating an item as admin"""
        response = client.post(
            "/api/item-types/",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "uid": "NEW001",
                "name": "New Test Item",
                "description": "A new test item",
                "category": "Electronics",
                "quantity": 5,
                "location": "Shelf B2"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["uid"] == "NEW001"
        assert data["name"] == "New Test Item"
        assert data["quantity"] == 5
    
    def test_create_item_duplicate_uid(self, client, admin_token, sample_item):
        """Test creating item with duplicate UID"""
        response = client.post(
            "/api/item-types/",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "uid": sample_item.uid,
                "name": "Duplicate Item",
                "quantity": 1
            }
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_get_item_by_uid(self, client, sample_item):
        """Test retrieving an item by UID"""
        response = client.get(f"/api/item-types/{sample_item.uid}")
        assert response.status_code == 200
        data = response.json()
        assert data["uid"] == sample_item.uid
        assert data["name"] == sample_item.name
    
    def test_get_item_not_found(self, client):
        """Test retrieving non-existent item"""
        response = client.get("/api/item-types/NONEXISTENT")
        assert response.status_code == 404
    
    def test_list_items(self, client, db_session):
        """Test listing all items"""
        # Create multiple items
        items = [
            Item(uid=f"ITEM{i:03d}", name=f"Item {i}", quantity=i)
            for i in range(1, 6)
        ]
        for item in items:
            db_session.add(item)
        db_session.commit()
        
        response = client.get("/api/item-types/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
        assert all(item["uid"] in [f"ITEM{i:03d}" for i in range(1, 6)] for item in data)
    
    def test_list_items_with_filter(self, client, db_session):
        """Test listing items with availability filter"""
        # Create items with different availability
        available_item = Item(uid="AVAIL001", name="Available", available=True)
        unavailable_item = Item(uid="UNAVAIL001", name="Unavailable", available=False)
        db_session.add(available_item)
        db_session.add(unavailable_item)
        db_session.commit()
        
        # Filter for available items
        response = client.get("/api/item-types/?available=true")
        assert response.status_code == 200
        data = response.json()
        assert all(item["available"] is True for item in data)
        assert any(item["uid"] == "AVAIL001" for item in data)
        assert not any(item["uid"] == "UNAVAIL001" for item in data)
    
    def test_list_items_pagination(self, client, db_session):
        """Test listing items with pagination"""
        # Create 10 items
        for i in range(10):
            item = Item(uid=f"PAGE{i:03d}", name=f"Item {i}")
            db_session.add(item)
        db_session.commit()
        
        # Get first 5
        response = client.get("/api/item-types/?skip=0&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
        
        # Get next 5
        response = client.get("/api/item-types/?skip=5&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
    
    def test_update_item_as_admin(self, client, admin_token, sample_item):
        """Test updating an item as admin"""
        response = client.put(
            f"/api/item-types/{sample_item.uid}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "Updated Item Name",
                "quantity": 10
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Item Name"
        assert data["quantity"] == 10
    
    def test_delete_item_as_admin(self, client, admin_token, sample_item):
        """Test deleting an item as admin"""
        response = client.delete(
            f"/api/item-types/{sample_item.uid}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        # Verify item is deleted
        response = client.get(f"/api/item-types/{sample_item.uid}")
        assert response.status_code == 404
    
    def test_create_item_as_user_forbidden(self, client, user_token):
        """Test that regular users cannot create items"""
        response = client.post(
            "/api/item-types/",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "uid": "FORBIDDEN001",
                "name": "Forbidden Item",
                "quantity": 1
            }
        )
        assert response.status_code == 403

