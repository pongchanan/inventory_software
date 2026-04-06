# Backend

## Project Layers

| Layer | Folder | Responsibility |
|-------|--------|----------------|
| **Routes** | `app/routes/` | Define endpoints, parse requests, return responses |
| **Services** | `app/services/` | Business logic, DB queries, authentication |
| **Schemas** | `app/schemas/` | Pydantic models for validation and serialization |
| **Models** | `app/models/` | SQLAlchemy ORM table definitions |
| **MQTT** | `app/mqtt/` | Broker connection and incoming message handlers |

## Running the Server

```bash
python main.py
```

Server starts on `http://localhost:3000` with auto-reload. Docs at `/docs`.

## Endpoints

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/login` | No | Authenticate with email + password, returns JWT |
| `POST` | `/register` | No | Register a new user. Set `register_card_now: true` to trigger IoT card scan and wait for link |
| `POST` | `/register/with-card` | No | Register with card_id provided directly (no IoT scan) |
| `GET` | `/me` | JWT | Get current authenticated user |

### Users — `/api/users` (admin only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Admin | List all users |
| `GET` | `/{user_id}` | Admin | Get user by ID |
| `PATCH` | `/{user_id}` | Admin | Update user fields (name, email, role, is_blacklist) |

### Card — `/api/users/me` (JWT owner)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/link-card` | JWT | Tell IoT to enter register mode, wait for card scan, link card to current user |
| `POST` | `/unlink-card` | JWT | Remove the linked card from the current user |

### Items — `/api/items`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | No | List active items (paginated). Query params: `page` (default 1), `page_size` (default 20, max 100). Each item includes a presigned S3 URL for its first enrolled sample image |
| `POST` | `/enroll` | Admin | Create a new item and enroll it via video upload. Multipart: `name`, `quantity`, `video` (file). Runs YOLO detection + embedding pipeline. Returns item fields plus `accepted_count`, `rejected_count`, `frames_sampled`, and first sample `image` URL |
| `PATCH` | `/{item_id}/quantity` | Admin | Adjust stock quantity by a delta. Body: `{ "delta": <int> }`. Positive = add stock, negative = remove. Returns `400` if result would go below 0 |

### Borrowings — `/api/borrowings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/me` | JWT | List current user's active borrowings (paginated) |
| `GET` | `/users/{user_id}` | Admin | List a specific user's active borrowings (paginated) |

### Sessions — `/api/sessions` (admin only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Admin | List cabinet open/close logs (paginated). Includes user info, open_at, close_at, close_image_path |
| `GET` | `/images` | Admin | List all session close images as presigned S3 URLs (paginated). Query params: `page`, `page_size` |
| `POST` | `/{session_id}/close-image` | No | (ESP32-CAM) Upload raw JPEG body to close a session and store image in S3 |
| `GET` | `/{session_id}/image` | Admin | Redirect to 30-min presigned S3 URL for a session's close image |

### Damaged Reports — `/api/damaged-reports`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Admin | List all damage reports across all users |
| `GET` | `/me` | JWT | List own damage reports |
| `GET` | `/user/{user_id}` | Admin | List damage reports filed by a specific user |
| `GET` | `/export` | Admin | Download all damage reports as an Excel file |
| `GET` | `/{report_id}/image` | JWT | Redirect to 30-min presigned S3 URL for the report's illustration image |
| `POST` | `/` | JWT | File a damage report for the user's currently active borrow. Multipart: `topic`, `description`, `image` (JPEG). `item_id` auto-resolved from active borrowing |
| `POST` | `/admin` | Admin | File a damage report for any item. Multipart: `topic`, `description`, `item_id`, `image` (JPEG). Decrements item quantity by 1 |
| `POST` | `/{report_id}/approve` | Admin | Approve a damage report. Optional JSON body: `{ "admin_comment": "..." }`. Sets `approved=true`, closes the borrowing backdated to `report_at`, returns updated report |

### General

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API status |
| `GET` | `/health` | Health check |

## MQTT

Subscribes to the wildcard topic from `MQTT_SUBSCRIBE_TOPICS` env (default: `cabinet/#`).

Messages are dispatched by sub-topic:

| Sub-topic | Handler | Description |
|-----------|---------|-------------|
| `access/request` | `handle_open_cabinet` | Verify card, create an OpenSession record |
| `door/closed` | `handle_close_cabinet` | Receive image, close the active session |
| `card/scanned` | `handle_register_card_scan` | IoT scanned a card during registration — links card to pending user |

### MQTT Topics

| Topic | Direction | Purpose |
|-------|-----------|----------|
| `cabinet/access/request` | IoT → Backend | NFC card scanned for cabinet access |
| `cabinet/access/response` | Backend → IoT | Access result (session_id) |
| `cabinet/door/closed` | IoT → Backend | Door closed with captured image |
| `cabinet/card/register` | Backend → IoT | Enter register mode (with user_id) |
| `cabinet/card/scanned` | IoT → Backend | Card scanned during registration |
| `cabinet/card/registered` | Backend → IoT | Registration confirmation/error |

To add a new handler: create a file in `app/mqtt/handlers/`, then register it in `handlers/__init__.py` `HANDLER_MAP`.

To publish from any service: `from app.mqtt.client import publish`.

## Scripts

Run from the `backend/` directory with the venv activated.

| Script | Command | Description |
|--------|---------|-------------|
| **reset_db** | `python scripts/reset_db.py` | Drops all tables (CASCADE) and recreates them. **Destroys all data.** |
| **migrate_db** | `python scripts/migrate_db.py` | Adds new tables and missing columns. Safe for production. |

## Tests

All tests are unit tests — no real database or network required (everything is mocked).

### Setup

```bash
# From backend/ with venv activated
pip install -r requirements.txt
```

### Run all tests

```bash
pytest
```

### Useful options

```bash
pytest -v                          # verbose — show each test name
pytest --tb=short                  # short traceback on failure (default)
pytest -x                          # stop on first failure
pytest -k "damaged"                # run only tests whose name matches "damaged"
pytest tests/unit-tests/test_damaged_report_service.py   # run a single file
pytest tests/unit-tests/test_damaged_report_service.py::TestCreateAdminReport  # single class
```

> Config lives in `pytest.ini` — test discovery is scoped to `tests/unit-tests/`.

| Test file | Covers |
|-----------|--------|
| `test_auth_service.py` | Password hashing, JWT creation/decoding, user authentication |
| `test_registration_service.py` | Register user (with and without card), duplicate checks |
| `test_users_service.py` | List users, get by ID, update user |
| `test_items_service.py` | List active items, pagination |
| `test_borrowings_service.py` | User borrowings pagination, popular items ranking |
| `test_sessions_service.py` | List sessions, close session with image (S3 success/failure), presigned URL generation |
| `test_damaged_report_service.py` | List all/by-user reports, presigned image URL, user report creation (auto item_id), admin report creation (quantity decrement), Excel export |
| `test_due_date_checker.py` | Overdue email, due-tomorrow reminder, no email when not due |
| `test_email_service.py` | Skip when SMTP unconfigured, successful send, failure handling |
