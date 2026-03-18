# Test Configuration Separation - Summary

**Task:** M1-07 - Adjust test config to run automated and manual tests clearly separated

**Completion Date:** 2026-03-18

## ✅ Changes Completed

### 1. Manual Tests Enhanced with Proper Markers
**Files Changed:**
- `backend/test/manual/test_cors.py` - Added `@pytest.mark.manual` and `@pytest.mark.integration`, proper test function
- `backend/test/manual/test_kiosk_flow.py` - Added `@pytest.mark.manual` and `@pytest.mark.integration`, proper test function

**Benefits:**
- Tests are now discoverable and properly categorized
- Clear indication of what each test requires
- Automatic skipping if services unavailable

### 2. Test Configuration Enhanced (pytest.ini)
**File:** `backend/test/pytest.ini`

**Key Improvements:**
- Clear explanation of all markers (unit, integration, contract, manual, slow)
- Comprehensive documentation of common test commands
- Default behavior: runs automated tests only, ignores manual tests
- Manual tests must be explicitly invoked

### 3. Manual Tests Conftest Created
**File:** `backend/test/manual/conftest.py`

**Purpose:**
- Ensures manual marker is properly registered
- Central location for manual test configuration

### 4. README Updated with Comprehensive Guide
**File:** `backend/test/README.md`

**New Content Includes:**
- Clear separation of automated vs manual tests
- Organization by test type (unit, integration, contract, manual)
- TDD workflow guidance
- Common pytest commands with descriptions
- Marker usage guidance with examples
- Troubleshooting section
- CI/CD integration patterns
- Development workflow examples

### 5. TDD Checklist Enhanced
**File:** `backend/test/TDD_CHECKLIST.md`

**New Content Includes:**
- Red-Green-Refactor cycle with real commands
- Detailed marker usage with examples
- Quick command reference table
- Test isolation best practices
- Pre-merge verification checklist

### 6. Test Runner Helper Scripts
**Files Created:**
- `backend/test/test_runner.py` - Python helper for running test suites
- `backend/test/test.bat` - Windows batch script for test commands
- `backend/test/test.sh` - Bash script for Linux/Mac test commands

**Available Commands:**
```
auto           - Run automated tests (fastest, for TDD)
unit           - Run unit tests only
contract       - Run contract tests only
integration    - Run integration tests
manual         - Run manual tests (requires backend at http://localhost:3000)
fast           - Fast TDD loop (unit+contract, stop on first failure)
all            - Run all tests
coverage       - Run with coverage (automated only)
coverage-all   - Run all tests with coverage
```

## 📋 Test Separation Strategy

### Automated Tests (Default - Runs by Default)
```bash
# From backend/test directory or backend directory:
pytest                           # All automated
pytest -m unit                   # Unit tests only
pytest -m contract               # Contract tests only
pytest -m integration            # Integration tests only
pytest -x                        # Stop on first failure (TDD)
python test_runner.py auto       # Using helper script
```

**Characteristics:**
- ✓ No external dependencies needed
- ✓ Fast (< 30 seconds typical)
- ✓ Deterministic (reproducible results)
- ✓ Use test databases (sqlite in-memory)
- ✓ Safe for CI/CD pipelines

### Manual Tests (Explicit Invocation Only)
```bash
# Requires backend running at http://localhost:3000
pytest test/manual                     # All manual tests
pytest test/manual -v                  # With verbose output
pytest test/manual -v -s               # Show print statements
python test_runner.py manual           # Using helper script
```

**Characteristics:**
- ⚙ Require external services (backend, frontend)
- ⚙ Non-deterministic (depend on external state)
- ⚙ For QA and integration verification
- ⚙ Not included in default CI/CD

## 🎯 Test Markers

| Marker | Purpose | Run Command |
|--------|---------|-------------|
| `@pytest.mark.unit` | Single component, no deps | `pytest -m unit` |
| `@pytest.mark.contract` | API validation | `pytest -m contract` |
| `@pytest.mark.integration` | Cross-component | `pytest -m integration` |
| `@pytest.mark.manual` | External services req. | `pytest test/manual` |
| `@pytest.mark.slow` | Long-running tests | `pytest -m "not slow"` |

## 📂 Directory Structure

```
backend/test/
├── pytest.ini              # Main pytest configuration
├── conftest.py            # Shared fixtures
├── TDD_CHECKLIST.md       # TDD workflow guide
├── README.md              # Comprehensive testing guide
├── test_runner.py         # Python helper script
├── test.bat               # Windows helper script
├── test.sh                # Linux/Mac helper script
├── test_auth.py           # Automated tests
├── test_contract_api.py   # Automated tests
├── test_items.py          # Automated tests
├── test_mqtt_handlers.py  # Automated tests
├── test_users.py          # Automated tests
└── manual/                # Manual tests (excluded by default)
    ├── conftest.py        # Manual test configuration
    ├── test_cors.py       # @pytest.mark.manual
    └── test_kiosk_flow.py # @pytest.mark.manual
```

## 🚀 Quick Start

### For Development (TDD)
```bash
cd backend

# Fast feedback loop
pytest -x                  # Stop on first failure

# Specific test types
pytest -m unit             # Just unit tests
pytest -m contract         # Just contract tests

# With coverage
pytest --cov=app
```

### Before Committing
```bash
cd backend

# Verify all automated tests pass
pytest

# Check coverage
pytest --cov=app --cov-report=term-missing
```

### Before Deployment
```bash
cd backend

# Make sure backend is running at http://localhost:3000
pytest test/manual -v      # Run manual tests
```

## 💡 Key Benefits

1. **Clear Separation** - Automated vs manual tests are unmistakably different
2. **Fast TDD Loop** - Default behavior excludes slow manual tests
3. **Comprehensive Documentation** - Developers know exactly how to run tests
4. **Helper Scripts** - Easy cross-platform execution
5. **Proper Markers** - Tests are categorized and discoverable
6. **CI/CD Ready** - Automated tests safe for pipelines, manual tests excluded
7. **Scalable** - Easy to add new test categories

## 🔄 Testing Workflow

```
1. Write failing test (TDD)
   pytest -x

2. Implement feature
   pytest -x  (quick feedback)

3. Verify all automated tests
   pytest

4. Check coverage
   pytest --cov=app

5. (Optional) Test with running backend
   pytest test/manual -v

6. Commit & Push
```

## 📞 Usage Help

```bash
# Python helper
python test_runner.py help

# Bash script
./test.sh help

# Windows batch
test.bat help
```

---

**Configuration Status:** ✅ Complete and Ready for Use
