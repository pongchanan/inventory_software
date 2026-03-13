"""Tests for auth contract and token behavior."""

from datetime import datetime, timedelta

from jose import jwt

from app.auth import create_access_token


class TestTokenCreation:
    def test_create_access_token(self):
        data = {"sub": "USER001"}
        token = create_access_token(data)
        assert token is not None
        assert len(token) > 0

    def test_token_contains_correct_data(self):
        data = {"sub": "USER001", "role": "admin"}
        token = create_access_token(data)

        from app.auth import ALGORITHM, SECRET_KEY

        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert decoded["sub"] == "USER001"
        assert decoded["role"] == "admin"
        assert "exp" in decoded

    def test_token_custom_expiration(self):
        data = {"sub": "USER001"}
        delta = timedelta(minutes=5)
        token = create_access_token(data, expires_delta=delta)

        from app.auth import ALGORITHM, SECRET_KEY

        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp_ts = decoded["exp"]
        now_ts = datetime.utcnow().timestamp()
        assert exp_ts > now_ts
        assert exp_ts - now_ts < 12 * 60 * 60


class TestAuthenticationEndpoints:
    def test_login_success(self, client, admin_user):
        response = client.post(
            "/api/auth/login",
            json={"email": admin_user.email, "password": "admin123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == admin_user.email

    def test_login_invalid_credentials(self, client, admin_user):
        response = client.post(
            "/api/auth/login",
            json={"email": admin_user.email, "password": "wrongpassword"},
        )
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        response = client.post(
            "/api/auth/login",
            json={"email": "none@test.com", "password": "password"},
        )
        assert response.status_code == 401

    def test_auth_me_without_token(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_auth_me_with_token(self, client, user_token):
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["uid"] == "USER001"
        assert data["authorized"] is True
