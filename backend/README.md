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
| `POST` | `/login` | No | Authenticate with email + password, returns JWT and user object |
| `POST` | `/register` | No | Register a new user. Set `register_card_now: true` to trigger IoT card scan and wait for link |
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
| `POST` | `/link-card` | JWT | Tell IoT to enter register mode, wait up to 15s for card scan, link card to current user. Returns `408` on timeout, `409` if already linked |
| `POST` | `/unlink-card` | JWT | Remove the linked NFC card from current user |

### Items — `/api/items`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | No | List active items (paginated). Query: `page`, `page_size` (max 100). `image` field is a 30-min presigned S3 URL ready for `<img src>` |
| `POST` | `/enroll` | Admin | Enroll a new item via video upload. Multipart: `name`, `quantity`, `video` (file). Runs YOLO + embedding pipeline. Returns item fields plus `accepted_count`, `rejected_count`, `frames_sampled`, `image` |
| `PATCH` | `/{item_id}/quantity` | Admin | Adjust stock. Body: `{ "delta": <int> }`. Positive = add, negative = remove. Returns `400` if result goes below 0 |

### Borrowings — `/api/borrowings`

Each borrowing response includes nested `user` (id, name, email, card_id) and `item` (id, name, image_url as presigned S3 URL).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/me` | JWT | Paginated list of current user's active (unreturned) borrowings |
| `GET` | `/admin/all` | Admin | Paginated list of all borrowings across all users |
| `GET` | `/users/{user_id}` | Admin | Paginated list of a specific user's active borrowings |
| `GET` | `/popular` | Admin | Paginated list of most-borrowed items ranked by borrow count |

### Sessions — `/api/sessions`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Admin | Paginated cabinet open/close log. Includes user info, `open_at`, `close_at`, `close_image_path` |
| `GET` | `/images` | Admin | Paginated list of session close images as presigned S3 URLs |
| `POST` | `/{session_id}/close-image` | No | (ESP32-CAM) Upload raw JPEG body to close a session and store image in S3. Triggers AI diff in background |
| `GET` | `/{session_id}/image` | Admin | Redirect to 30-min presigned S3 URL for a session's close image |

### Damaged Reports — `/api/damaged-reports`

Each report response includes nested `user` (reporter info) and `item` (with `image_url` presigned), plus `illustrated_url` — a presigned URL for the damage photo, ready for `<img src>`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Admin | List all damage reports, newest first |
| `GET` | `/me` | JWT | List own damage reports |
| `GET` | `/user/{user_id}` | Admin | List damage reports filed by a specific user |
| `GET` | `/export` | Admin | Download all reports as an Excel file |
| `GET` | `/{report_id}/image` | JWT | Redirect to 30-min presigned S3 URL for the report's illustration image |
| `POST` | `/` | JWT | File a damage report. Multipart: `topic`, `description`, `image` (JPEG). `item_id` auto-resolved from active borrowing |
| `POST` | `/admin` | Admin | File a damage report for any item. Multipart: `topic`, `description`, `item_id`, `image` (JPEG). Auto-approved, decrements item quantity by 1 |
| `POST` | `/{report_id}/approve` | Admin | Approve a user report. Optional body: `{ "admin_comment": "..." }`. Records `approved_by`, closes the linked borrowing backdated to `report_at` |

### Activity Log — `/api/activity-log` (admin only)

Unified time-sorted event stream across sessions, borrowings, and damage reports.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Admin | All events newest-first. Each entry: `event_type`, `timestamp`, `reference_id`, `user_id`, `user_name`, `item_id`, `item_name`, `detail` |

**`event_type` values:**

| Value | Source |
|-------|--------|
| `session_open` | Cabinet opened via NFC |
| `session_close` | Door magnet detected close |
| `borrowing` | Item borrowing recorded |
| `borrowing_return` | Borrowing closed (item returned) |
| `damage_report` | Damage report filed |
| `damage_report_approved` | Admin approved a damage report |

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
