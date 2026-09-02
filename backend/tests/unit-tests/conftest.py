import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

from app.models.user import User
from app.models.item import Item
from app.models.borrowing import Borrowing
from app.models.open_session import OpenSession
from app.models.damaged_item_report import DamagedItemReport


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


@pytest.fixture
def sample_item():
    item = MagicMock(spec=Item)
    item.id = 1
    item.name = "Screwdriver"
    item.locker_number = None
    item.image_path = "/images/screwdriver.jpg"
    item.quantity = 5
    item.is_active = True
    return item


@pytest.fixture
def sample_borrowing():
    b = MagicMock(spec=Borrowing)
    b.id = 1
    b.item_id = 1
    b.user_id = 1
    b.borrow_at = datetime(2026, 3, 1, 10, 0)
    b.due_at = datetime(2026, 3, 8, 10, 0)
    b.return_at = None
    return b


@pytest.fixture
def sample_session():
    s = MagicMock(spec=OpenSession)
    s.id = 1
    s.close_image_path = None
    s.open_by = 1
    s.open_at = datetime(2026, 3, 1, 10, 0)
    s.close_at = None
    return s


@pytest.fixture
def sample_damaged_report():
    r = MagicMock(spec=DamagedItemReport)
    r.id = 1
    r.topic = "Cracked screen"
    r.description = "The screen has a visible crack"
    r.item_id = 1
    r.report_at = datetime(2026, 4, 1, 9, 0)
    r.report_by = 1
    r.illustrated_path = "damaged-reports/user_1_abcd1234.jpg"
    return r
