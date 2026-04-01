import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

from app.models.user import User


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    db.query.return_value.order_by.return_value.all.return_value = []
    return db


@pytest.fixture
def sample_user():
    user = MagicMock(spec=User)
    user.id = 1
    user.name = "Test User"
    user.email = "test@example.com"
    user.role = "user"
    user.card_id = "CARD001"
    user.is_blacklist = False
    user.created_at = datetime(2026, 1, 1)
    user.password_hash = "$2b$12$fakehash"
    return user


@pytest.fixture
def sample_admin():
    user = MagicMock(spec=User)
    user.id = 99
    user.name = "Admin"
    user.email = "admin@example.com"
    user.role = "admin"
    user.card_id = None
    user.is_blacklist = False
    user.created_at = datetime(2026, 1, 1)
    user.password_hash = "$2b$12$fakehash"
    return user
