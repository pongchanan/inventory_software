# Backend Unit Tests

This directory contains unit tests for the FastAPI backend application, organized into **automated tests** (fast, deterministic) and **manual tests** (require running services).

## Test Organization

### ✅ Automated Tests (Default)
Located in main `test/` directory:
- `test_auth.py` - Authentication logic (unit/contract)
- `test_contract_api.py` - API contract validation (contract)
- `test_items.py` - Item management (unit)
- `test_mqtt_handlers.py` - MQTT handlers (unit)
- `test_users.py` - User management (unit)

**Characteristics:**
- ✓ No external dependencies needed
- ✓ Run in CI/CD pipelines
- ✓ Fast (< 30 seconds typical)
- ✓ Deterministic (same result every run)
- ✓ Use SQLite in-memory databases

### 🔧 Manual Tests (Explicit)
Located in `test/manual/` directory:
- `test_cors.py` - CORS headers integration (requires running backend)
- `test_kiosk_flow.py` - Full kiosk registration flow (requires running backend + frontend)

**Characteristics:**
- ⚙ Require backend running at `http://localhost:3000`
- ⚙ May require frontend running
- ⚙ Non-deterministic (depend on external state)
- ⚙ For manual QA and integration verification
- ⚙ Excluded by default

## TDD Workflow (Default)

Use Red-Green-Refactor for every change:
1. Red: write or extend a failing test first.
2. Green: implement the smallest change to make it pass.
3. Refactor: clean up code while keeping tests green.

Manual tests under `test/manual/` are excluded by default so local TDD loops stay fast and deterministic.

## Marker Guidance

Use pytest markers to categorize tests:

- `@pytest.mark.unit`: Single component, no network, no external services
- `@pytest.mark.integration`: Cross-component behavior inside backend (may use test database)
- `@pytest.mark.contract`: API request/response validation and schema guarantees
- `@pytest.mark.manual`: Hardware/external dependencies, requires explicit invocation only

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

### 🏃 Fast Automated Tests (Recommended for TDD)
```bash
pytest
```
Runs all automated tests, excluding manual tests. Typical runtime: < 30 seconds.

### 🏃 Fast TDD Loop (Stop on First Failure)
```bash
pytest -x
```
Exits after first failing test for rapid feedback.

### 📋 Run Contracts Only
```bash
pytest -m contract
```
Validates API contract tests only (request/response schemas).

### 🧪 Run Unit Tests Only
```bash
pytest -m unit
```
Runs single-component tests without integration.

### 🔌 Run Integration Tests Only
```bash
pytest -m integration
```
Runs cross-component tests within the backend.

### 📊 Run Tests with Coverage
```bash
pytest --cov=app --cov-report=html
```
Generates HTML coverage report in `htmlcov/` directory.

### 🔧 Manual Tests (Requires Services Running)

**Prerequisites:**
```bash
# Terminal 1: Start backend
cd ../..
npm run dev:backend

# Terminal 2: Start frontend (for kiosk flow test)
npm run dev:frontend

# Terminal 3: Run manual tests
cd backend/test
```

**Run all manual tests:**
```bash
pytest test/manual
```

**Run specific manual test:**
```bash
pytest test/manual/test_cors.py -v
pytest test/manual/test_kiosk_flow.py -v
```

**Run manual tests with output:**
```bash
pytest test/manual -v -s
```
The `-s` flag shows print statements for debugging.

### 📦 Comprehensive Suite (CI/CD)

**Run all tests (auto + manual):**
```bash
pytest --cov=app
```
Only run this if backend and frontend are running and you want complete coverage.

## Test Markers

Combine markers for specific test suites:

| Command | Purpose |
|---------|---------|
| `pytest` | All automated tests (default) |
| `pytest -m "not slow"` | Exclude slow tests |
| `pytest -m "unit or contract"` | Fast deterministic tests |
| `pytest -m integration` | Cross-component integration tests |
| `pytest test/manual` | Manual tests only |
| `pytest -m manual` | Manual tests by marker |
| `pytest --cov=app` | All with coverage |

## Troubleshooting

### Tests fail with "database is locked"
Some tests may conflict over database access. Run with `-n 0` to disable parallel execution:
```bash
pytest -n 0
```

### Manual test says "Backend server not running"
Make sure backend is running:
```bash
npm run dev:backend
```

### Long test names or unclear failures?
Use verbose output:
```bash
pytest -vv
```

### Want to run tests in parallel?
Install and run with pytest-xdist:
```bash
pip install pytest-xdist
pytest -n auto
```

## CI/CD Integration

For continuous integration pipelines, use:
```bash
# Fast smoke test (automated only)
pytest -m "unit or contract"

# Full integration test
pytest --ignore=test/manual --cov=app

# Comprehensive (only if backend service is available)
pytest --cov=app
```

## Development Workflow Example

```bash
# 1. Write failing test
# 2. Implement feature
pytest -x                    # Quick feedback loop

# 3. Verify with all tests
pytest

# 4. Check coverage
pytest --cov=app --cov-report=term-missing

# 5. Run manual tests before deployment
pytest test/manual -v
```
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
