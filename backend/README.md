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
| `POST` | `/register` | No | Register a new user (card_id=None, link card later) |
| `POST` | `/register/with-card` | No | Register with card scan in one step |
| `GET` | `/me` | JWT | Get current authenticated user |

### Users — `/api/users` (admin only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Admin | List all users |
| `GET` | `/{user_id}` | Admin | Get user by ID |
| `PATCH` | `/{user_id}` | Admin | Update user fields (name, email, role, card_id, is_blacklist) |

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
