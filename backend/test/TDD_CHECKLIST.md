# TDD Checklist

Use this checklist for each feature or bug fix.

## Red-Green-Refactor Cycle

1. **Red**: Define expected behavior in 1-2 sentences and write a failing test
2. **Green**: Implement minimal code to satisfy the test  
3. **Refactor**: Clean up implementation while keeping tests green
4. **Run full suite**: `pytest` - confirm all tests pass

## Complete Workflow

```bash
# 1. Start with a failing test
pytest -x                          # Stop on first failure for quick feedback

# 2. Implement the feature
# ... write code ...

# 3. Verify all tests pass
pytest                             # All automated tests

# 4. Check code quality and coverage
pytest --cov=app --cov-report=term-missing

# 5. Before merge, run manual tests
pytest test/manual -v              # Requires backend + frontend running
```

## Marker Usage

Apply markers to categorize your tests properly:

### Unit Tests (@pytest.mark.unit)
- Single component in isolation
- No network calls or external services
- No database (use in-memory fixtures)
- Mock external dependencies
- **Run with:** `pytest -m unit` (~5-10 seconds)

```python
@pytest.mark.unit
def test_user_password_validation():
    """Test password validation logic in isolation."""
    assert validate_password("weak") is False
    assert validate_password("Str0ng!Pass") is True
```

### Integration Tests (@pytest.mark.integration)
- Cross-component interactions
- Test database usage (transactions, seeds)
- Multiple components working together
- Still no external services (mock them)
- **Run with:** `pytest -m integration`

```python
@pytest.mark.integration
def test_user_creation_flow(db_session):
    """Test user creation through multiple components."""
    user = create_user(db_session, "student@example.com")
    assert user is not None
    assert db_session.query(User).count() == 1
```

### Contract Tests (@pytest.mark.contract)
- API endpoint request validation
- Response schema validation
- HTTP status codes and headers
- Data serialization guarantees
- **Run with:** `pytest -m contract` (~10-15 seconds)

```python
@pytest.mark.contract
def test_login_endpoint_response_schema(client):
    """Validate login endpoint returns correct response structure."""
    response = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "password"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "token_type" in data
```

### Manual Tests (@pytest.mark.manual)
- Requires backend running at `http://localhost:3000`
- May require frontend running
- External API integration tests
- QA verification flows
- **Run with:** `pytest test/manual -v`

```python
@pytest.mark.manual
@pytest.mark.integration
def test_kiosk_registration_flow():
    """End-to-end kiosk registration (requires running backend)."""
    # Skip if backend not running
    response = requests.post("http://localhost:3000/api/...")
    assert response.status_code == 200
```

## Quick Commands

| Task | Command |
|------|---------|
| **TDD loop** | `pytest -x` |
| **All automated** | `pytest` |
| **Fast tests only** | `pytest -m "unit or contract"` |
| **Unit tests** | `pytest -m unit` |
| **Contract tests** | `pytest -m contract` |
| **Integration** | `pytest -m integration` |
| **With coverage** | `pytest --cov=app` |
| **Manual tests** | `pytest test/manual -v` |
| **Helper scripts** | `python test_runner.py help` or `test.bat help` |

## Test Isolation Best Practices

1. **Use fixtures**: Don't create objects in tests manually
   ```python
   @pytest.fixture
   def test_user(db_session):
       return create_user(db_session, "test@example.com")
   
   def test_something(test_user):  # Automatically cleaned up
       assert test_user.email == "test@example.com"
   ```

2. **Mock external calls**: Don't hit real APIs
   ```python
   @mock.patch("app.services.send_email")
   def test_user_registration_email(mock_send):
       register_user("new@example.com")
       mock_send.assert_called_once()
   ```

3. **Use database transactions**: Tests don't interfere
   ```python
   @pytest.fixture
   def db_session():
       # Each test gets fresh database
       Base.metadata.create_all(bind=engine)
       session = SessionLocal()
       try:
           yield session
       finally:
           session.rollback()
           Base.metadata.drop_all(bind=engine)
   ```

## Pre-Merge Checklist

Before pushing code:
- [ ] `pytest` passes (all automated tests)
- [ ] `pytest --cov=app` shows no decrease in coverage
- [ ] Manual tests pass if API changed: `pytest test/manual -v`
- [ ] No import errors: `python -c "from app import main"`
- [ ] Code follows project style: Check with linter if configured
