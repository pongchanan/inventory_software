"""
Tests for authentication functionality
"""
import pytest
from app.auth import hash_password, verify_password, create_access_token
from jose import jwt
from datetime import datetime, timedelta


class TestPasswordHashing:
    """Test password hashing and verification"""
    
    def test_hash_password(self):
        """Test that password hashing works"""
        password = "test_password"
        hashed = hash_password(password)
        assert hashed != password
        assert len(hashed) > 0
    
    def test_verify_password_correct(self):
        """Test password verification with correct password"""
        password = "test_password"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True
    
    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password"""
        password = "test_password"
        hashed = hash_password(password)
        assert verify_password("wrong_password", hashed) is False
    
    def test_different_hashes_for_same_password(self):
        """Test that same password produces different hashes (salt)"""
        password = "test_password"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        assert hash1 != hash2
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)


class TestTokenCreation:
    """Test JWT token creation and validation"""
    
    def test_create_access_token(self):
        """Test creating an access token"""
        data = {"sub": "user123"}
        token = create_access_token(data)
        assert token is not None
        assert len(token) > 0
    
    def test_token_contains_correct_data(self):
        """Test that token contains the correct data"""
        data = {"sub": "user123", "role": "admin"}
        token = create_access_token(data)
        
        from app.auth import SECRET_KEY, ALGORITHM
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        assert decoded["sub"] == "user123"
        assert decoded["role"] == "admin"
        assert "exp" in decoded
    
    def test_token_expiration(self):
        """Test that token has expiration time"""
        data = {"sub": "user123"}
        token = create_access_token(data)
        
        from app.auth import SECRET_KEY, ALGORITHM
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        exp_timestamp = decoded["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp)
        assert exp_datetime > datetime.utcnow()
    
    def test_token_custom_expiration(self):
        """Test creating token with custom expiration"""
        data = {"sub": "user123"}
        delta = timedelta(minutes=5)
        token = create_access_token(data, expires_delta=delta)
        
        from app.auth import SECRET_KEY, ALGORITHM
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        exp_timestamp = decoded["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp)
        expected_exp = datetime.utcnow() + delta
        
        # Allow 2 second tolerance
        assert abs((exp_datetime - expected_exp).total_seconds()) < 2


class TestAuthenticationEndpoints:
    """Test authentication API endpoints"""
    
    def test_login_success(self, client, admin_user):
        """Test successful login"""
        response = client.post(
            "/api/auth/login",
            data={"username": "admin123", "password": "admin123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client, admin_user):
        """Test login with invalid credentials"""
        response = client.post(
            "/api/auth/login",
            data={"username": "admin123", "password": "wrongpassword"}
        )
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        response = client.post(
            "/api/auth/login",
            data={"username": "nonexistent", "password": "password"}
        )
        assert response.status_code == 401
    
    def test_protected_endpoint_without_token(self, client):
        """Test accessing protected endpoint without token"""
        response = client.get("/api/users/me")
        assert response.status_code == 401
    
    def test_protected_endpoint_with_token(self, client, user_token):
        """Test accessing protected endpoint with valid token"""
        response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["uid"] == "user123"
    
    def test_protected_endpoint_invalid_token(self, client):
        """Test accessing protected endpoint with invalid token"""
        response = client.get(
            "/api/users/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
    
    def test_admin_only_endpoint_as_user(self, client, user_token):
        """Test accessing admin-only endpoint as regular user"""
        response = client.post(
            "/api/item-types/",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "uid": "ITEM001",
                "name": "Test Item",
                "quantity": 1
            }
        )
        assert response.status_code == 403
    
    def test_admin_only_endpoint_as_admin(self, client, admin_token):
        """Test accessing admin-only endpoint as admin"""
        response = client.post(
            "/api/item-types/",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "uid": "ITEM001",
                "name": "Test Item",
                "quantity": 1
            }
        )
        assert response.status_code == 201

