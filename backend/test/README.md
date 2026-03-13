# Backend Unit Tests

This directory contains unit tests for the FastAPI backend application.

## TDD Workflow (Default)

Use Red-Green-Refactor for every change:
1. Red: write or extend a failing test first.
2. Green: implement the smallest change to make it pass.
3. Refactor: clean up code while keeping tests green.

Manual tests under `test/manual/` are excluded by default so local TDD loops stay fast and deterministic.

## Setup

1. Install testing dependencies:
```bash
pip install -r requirements-test.txt
```

2. Make sure you're in the backend directory:
```bash
cd backend
```

## Running Tests

### Run all tests:
```bash
pytest
```

### Fast TDD loop (recommended):
```bash
pytest -x
```

### Contract-only loop:
```bash
pytest -m contract
```

### Include manual tests explicitly:
```bash
pytest test/manual
```

### Run tests with coverage:
```bash
pytest --cov=app --cov-report=html
```

### Run specific test file:
```bash
pytest test/test_auth.py
```

### Run specific test class:
```bash
pytest test/test_items.py::TestItemModel
```

### Run specific test:
```bash
pytest test/test_auth.py::TestPasswordHashing::test_hash_password
```

### Run tests with verbose output:
```bash
pytest -v
```

### Run tests and stop at first failure:
```bash
pytest -x
```

## Test Structure

- **conftest.py**: Contains pytest fixtures and test configuration
- **test_auth.py**: Tests for authentication and authorization
- **test_items.py**: Tests for item management endpoints
- **test_users.py**: Tests for user management endpoints

## Test Coverage

Current test coverage includes:
- Password hashing and verification
- JWT token creation and validation
- User authentication and authorization
- Item CRUD operations
- User CRUD operations
- Role-based access control
- Database model validation

## Adding New Tests

1. Create a new test file following the naming convention `test_*.py`
2. Import necessary fixtures from `conftest.py`
3. Use descriptive test names that explain behavior and expected outcome
4. Follow the Arrange-Act-Assert pattern
5. Add marker where appropriate (`@pytest.mark.unit`, `@pytest.mark.integration`, `@pytest.mark.contract`)

Example:
```python
def test_feature_name(client, admin_token):
    # Arrange
    data = {"key": "value"}
    
    # Act
    response = client.post("/api/endpoint", json=data, 
                          headers={"Authorization": f"Bearer {admin_token}"})
    
    # Assert
    assert response.status_code == 200
    assert response.json()["key"] == "value"
```

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    cd backend
    pip install -r requirements.txt
    pip install -r test/requirements-test.txt
    pytest --cov=app --cov-report=xml
```
