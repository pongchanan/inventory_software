"""Pytest fixtures aligned with canonical v2 backend routes."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.models.item_type_core import ItemType
from app.models.storage_location_core import StorageLocation
from app.models.storage_unit_core import StorageUnit
from app.models.user import User
from app.routes import auth as auth_routes
from app.routes import users_api as users_routes
from main import app


SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def patch_password_backend(monkeypatch):
    """Keep contract tests stable regardless of local bcrypt backend issues."""
    monkeypatch.setattr(auth_routes, "verify_password", lambda plain, stored: plain == stored)
    monkeypatch.setattr(auth_routes, "hash_password", lambda password: password)
    monkeypatch.setattr(users_routes, "hash_password", lambda password: password)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session):
    user = User(
        nfc_card_uid="ADMIN001",
        email="admin@test.com",
        password_hash="admin123",
        role="admin",
        name="Test Admin",
        active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def regular_user(db_session):
    user = User(
        nfc_card_uid="USER001",
        email="user@test.com",
        password_hash="user123",
        role="user",
        name="Test User",
        active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(client, admin_user):
    response = client.post(
        "/api/auth/login",
        json={"email": admin_user.email, "password": "admin123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def user_token(client, regular_user):
    response = client.post(
        "/api/auth/login",
        json={"email": regular_user.email, "password": "user123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def sample_item_type(db_session):
    item_type = ItemType(name="ESP32", active=True)
    db_session.add(item_type)
    db_session.commit()
    db_session.refresh(item_type)
    return item_type


@pytest.fixture
def sample_storage_unit(db_session):
    unit = StorageUnit(unit_type="drawer", layout_type="grid", active=True)
    db_session.add(unit)
    db_session.commit()
    db_session.refresh(unit)
    return unit


@pytest.fixture
def sample_storage_location(db_session, sample_storage_unit):
    location = StorageLocation(
        unit_id=sample_storage_unit.id,
        level_no=0,
        row_no=0,
        col_no=0,
        active=True,
    )
    db_session.add(location)
    db_session.commit()
    db_session.refresh(location)
    return location
