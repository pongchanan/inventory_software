"""
Pytest configuration and fixtures for backend tests
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.auth import hash_password
from main import app
from app.models.user import User
from app.models.item import Item


# Use SQLite in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a new database session for each test"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database dependency override"""
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
    """Create an admin user for testing"""
    user = User(
        uid="admin123",
        email="admin@test.com",
        hashed_password=hash_password("admin123"),
        role="admin",
        name="Test Admin"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def regular_user(db_session):
    """Create a regular user for testing"""
    user = User(
        uid="user123",
        email="user@test.com",
        hashed_password=hash_password("user123"),
        role="user",
        name="Test User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(client, admin_user):
    """Get authentication token for admin user"""
    response = client.post(
        "/api/auth/login",
        data={"username": "admin123", "password": "admin123"}
    )
    return response.json()["access_token"]


@pytest.fixture
def user_token(client, regular_user):
    """Get authentication token for regular user"""
    response = client.post(
        "/api/auth/login",
        data={"username": "user123", "password": "user123"}
    )
    return response.json()["access_token"]


@pytest.fixture
def sample_item(db_session):
    """Create a sample item for testing"""
    item = Item(
        uid="RFID001",
        name="Test Item",
        description="A test item",
        category="Electronics",
        quantity=5,
        available=True,
        location="Shelf A1"
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item
