import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
    authenticate_user,
)


class TestHashPassword:
    def test_returns_string(self):
        result = hash_password("password123")
        assert isinstance(result, str)

    def test_different_passwords_different_hashes(self):
        h1 = hash_password("password1")
        h2 = hash_password("password2")
        assert h1 != h2

    def test_same_password_different_hashes(self):
        h1 = hash_password("password")
        h2 = hash_password("password")
        assert h1 != h2  # bcrypt uses random salt


class TestVerifyPassword:
    def test_correct_password(self):
        hashed = hash_password("secret")
        assert verify_password("secret", hashed) is True

    def test_wrong_password(self):
        hashed = hash_password("secret")
        assert verify_password("wrong", hashed) is False


class TestCreateAccessToken:
    def test_returns_string(self):
        token = create_access_token(1, "user")
        assert isinstance(token, str)

    def test_token_contains_claims(self):
        token = create_access_token(42, "admin")
        payload = decode_token(token)
        assert payload["sub"] == "42"
        assert payload["role"] == "admin"
        assert "exp" in payload
        assert "iat" in payload


class TestDecodeToken:
    def test_valid_token(self):
        token = create_access_token(1, "user")
        payload = decode_token(token)
        assert payload["sub"] == "1"

    def test_invalid_token(self):
        with pytest.raises(HTTPException) as exc:
            decode_token("invalid.token.here")
        assert exc.value.status_code == 401

    def test_expired_token(self):
        from datetime import datetime, timezone, timedelta
        import jwt
        from app.services.auth_service import JWT_SECRET, JWT_ALGORITHM

        payload = {
            "sub": "1",
            "role": "user",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
            "iat": datetime.now(timezone.utc) - timedelta(hours=2),
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        with pytest.raises(HTTPException) as exc:
            decode_token(token)
        assert exc.value.status_code == 401
        assert "expired" in exc.value.detail.lower()


class TestAuthenticateUser:
    def test_valid_credentials(self, mock_db, sample_user):
        sample_user.password_hash = hash_password("correct")
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        result = authenticate_user(mock_db, "test@example.com", "correct")
        assert result == sample_user

    def test_wrong_password(self, mock_db, sample_user):
        sample_user.password_hash = hash_password("correct")
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        with pytest.raises(HTTPException) as exc:
            authenticate_user(mock_db, "test@example.com", "wrong")
        assert exc.value.status_code == 401

    def test_user_not_found(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(HTTPException) as exc:
            authenticate_user(mock_db, "nobody@example.com", "pass")
        assert exc.value.status_code == 401

    def test_blacklisted_user(self, mock_db, sample_user):
        sample_user.password_hash = hash_password("correct")
        sample_user.is_blacklist = True
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        with pytest.raises(HTTPException) as exc:
            authenticate_user(mock_db, "test@example.com", "correct")
        assert exc.value.status_code == 403
