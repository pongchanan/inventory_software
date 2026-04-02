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

### General

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API status |
| `GET` | `/health` | Health check |

## MQTT

Subscribes to the wildcard topic from `MQTT_SUBSCRIBE_TOPICS` env.

Messages are dispatched by sub-topic:

| Sub-topic | Handler | Description |
|-----------|---------|-------------|
| `open-cabinet` | `handle_open_cabinet` | Verify card, create an OpenSession record |
| `register-card-scan` | `handle_register_card_scan` | IoT scanned a card during registration — links card to pending user |

### MQTT Topics

| Topic | Direction | Purpose |
|-------|-----------|----------|
| `inventory/iot/open-cabinet` | IoT → Backend | NFC card scanned for cabinet access |
| `inventory/iot/open-cabinet-result` | Backend → IoT | Access result (session_id) |
| `inventory/iot/register-card` | Backend → IoT | Enter register mode (with user_id) |
| `inventory/iot/register-card-scan` | IoT → Backend | Card scanned during registration |
| `inventory/iot/register-card-result` | Backend → IoT | Registration confirmation/error |

To add a new handler: create a file in `app/mqtt/handlers/`, then register it in `handlers/__init__.py` `HANDLER_MAP`.

To publish from any service: `from app.mqtt.client import publish`.

## Scripts

Run from the `backend/` directory with the venv activated.

| Script | Command | Description |
|--------|---------|-------------|
| **reset_db** | `python scripts/reset_db.py` | Drops all tables (CASCADE) and recreates them. **Destroys all data.** |
| **migrate_db** | `python scripts/migrate_db.py` | Adds new tables and missing columns. Safe for production. |

## Tests

```bash
pytest
```

Runs all unit tests in `tests/`. Tests use `unittest.mock` — no real database required.

| Test file | Covers |
|-----------|--------|
| `test_auth_service.py` | Password hashing, JWT creation/decoding, user authentication |
| `test_registration_service.py` | Register user (with and without card), duplicate checks |
| `test_users_service.py` | List users, get by ID, update user |
