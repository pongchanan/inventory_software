"""
Tests for user management functionality
"""
import pytest
from app.models.user import User
from app.auth import hash_password


class TestUserModel:
    """Test User model"""
    
    def test_create_user(self, db_session):
        """Test creating a user"""
        user = User(
            uid="USER001",
            email="test@example.com",
            hashed_password=hash_password("password"),
            role="user",
            name="Test User"
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.uid == "USER001"
        assert user.email == "test@example.com"
        assert user.role == "user"
        assert user.name == "Test User"
    
    def test_user_defaults(self, db_session):
        """Test user default values"""
        user = User(
            uid="USER002",
            email="test2@example.com",
            hashed_password=hash_password("password")
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.role == "user"
        assert user.active is True
        assert user.created_at is not None
    
    def test_user_unique_uid(self, db_session):
        """Test that UID must be unique"""
        user1 = User(
            uid="DUPLICATE",
            email="user1@example.com",
            hashed_password=hash_password("password")
        )
        db_session.add(user1)
        db_session.commit()
        
        user2 = User(
            uid="DUPLICATE",
            email="user2@example.com",
            hashed_password=hash_password("password")
        )
        db_session.add(user2)
        
        with pytest.raises(Exception):
            db_session.commit()
    
    def test_user_unique_email(self, db_session):
        """Test that email must be unique"""
        user1 = User(
            uid="USER003",
            email="duplicate@example.com",
            hashed_password=hash_password("password")
        )
        db_session.add(user1)
        db_session.commit()
        
        user2 = User(
            uid="USER004",
            email="duplicate@example.com",
            hashed_password=hash_password("password")
        )
        db_session.add(user2)
        
        with pytest.raises(Exception):
            db_session.commit()


class TestUserEndpoints:
    """Test user API endpoints"""
    
    def test_get_current_user(self, client, user_token, regular_user):
        """Test getting current user info"""
        response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["uid"] == regular_user.uid
        assert data["email"] == regular_user.email
        assert data["name"] == regular_user.name
    
    def test_create_user_as_admin(self, client, admin_token):
        """Test creating a user as admin"""
        response = client.post(
            "/api/users/",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "uid": "NEWUSER001",
                "email": "newuser@example.com",
                "password": "password123",
                "name": "New User",
                "role": "user"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["uid"] == "NEWUSER001"
        assert data["email"] == "newuser@example.com"
        assert "hashed_password" not in data  # Password should not be returned
    
    def test_create_user_duplicate_uid(self, client, admin_token, regular_user):
        """Test creating user with duplicate UID"""
        response = client.post(
            "/api/users/",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "uid": regular_user.uid,
                "email": "different@example.com",
                "password": "password123",
                "name": "Different User"
            }
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_list_users_as_admin(self, client, admin_token, db_session):
        """Test listing all users as admin"""
        response = client.get(
            "/api/users/",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1  # At least the admin user
        assert all("hashed_password" not in user for user in data)
    
    def test_list_users_as_regular_user(self, client, user_token):
        """Test that regular users cannot list all users"""
        response = client.get(
            "/api/users/",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403
    
    def test_get_user_by_uid(self, client, admin_token, regular_user):
        """Test getting a specific user by UID"""
        response = client.get(
            f"/api/users/{regular_user.uid}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["uid"] == regular_user.uid
        assert data["email"] == regular_user.email
    
    def test_update_user_as_admin(self, client, admin_token, regular_user):
        """Test updating a user as admin"""
        response = client.put(
            f"/api/users/{regular_user.uid}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": "Updated Name",
                "email": "updated@example.com"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["email"] == "updated@example.com"
    
    def test_delete_user_as_admin(self, client, admin_token, regular_user):
        """Test deleting a user as admin"""
        response = client.delete(
            f"/api/users/{regular_user.uid}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        # Verify user is deleted
        response = client.get(
            f"/api/users/{regular_user.uid}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404
    
    def test_create_user_as_regular_user_forbidden(self, client, user_token):
        """Test that regular users cannot create users"""
        response = client.post(
            "/api/users/",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "uid": "FORBIDDEN001",
                "email": "forbidden@example.com",
                "password": "password123",
                "name": "Forbidden User"
            }
        )
        assert response.status_code == 403
