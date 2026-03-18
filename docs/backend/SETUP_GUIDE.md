# Backend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Open `.env` and fill in your values. The minimum required for local development:

```dotenv
# SQLite is used automatically if DATABASE_URL is not set
DATABASE_URL=sqlite:///./inventory.db

JWT_SECRET=any-random-secret-string
JWT_ALGORITHM=HS256
```

For full functionality (images + MQTT) also set:

```dotenv
# S3-compatible storage (Tigris, AWS S3, etc.)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=...
AWS_ENDPOINT_URL=...
S3_BUCKET_NAME=...

# MQTT broker
MOSQUITTO_TCP_HOST=...
MOSQUITTO_TCP_PORT=1883
MOSQUITTO_USER=...
MQTT_SUBSCRIBE_TOPICS=kiosk/#
MQTT_PUBLISH_TOPICS=kiosk/response
```

### 3. Run the Server
```bash
python -m app.main
```

Or with auto-reload during development:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload
```

The server will start at `http://localhost:3000`.

### 4. Test the API
Visit `http://localhost:3000/docs` for interactive Swagger documentation.

---

## Project Structure

```
backend/
├── main.py                  # Compatibility entry point
├── requirements.txt
├── .env.example             # Template — copy to .env
├── app/
│   ├── main.py              # FastAPI app setup and router registration
│   ├── auth.py              # JWT helpers, password hashing, get_current_user
│   ├── database.py          # SQLAlchemy engine + SessionLocal + Base
│   ├── mqtt.py              # MQTT client (connects on startup, publishes/subscribes)
│   ├── mqtt_handlers.py     # Topic handlers: open_cabinet, register_card, heartbeat
│   ├── s3.py                # S3-compatible image upload helpers
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   └── routes/              # FastAPI routers (one file per resource)
├── db/
│   └── schema_v2.sql        # Shadow-schema SQL definition
├── ../docs/backend/
│   ├── API_DOCUMENTATION.md
│   └── SETUP_GUIDE.md
├── ../scripts/
│   ├── admin/
│   │   └── create_admin.py  # Create an admin user
│   ├── migration/
│   └── seed/
│       └── seed_data.py     # Populate DB with sample data
└── test/
```

---

## MQTT Handlers

Incoming kiosk messages are routed in `app/mqtt_handlers.py`.

| Topic | Handler | What it does |
|---|---|---|
| `kiosk/open_cabinet` | `open_cabinet` | Validates NFC UID against DB, publishes `ok` or `error` to `kiosk/response` |
| `kiosk/register_card` | `register_card` | Finds the active pending registration session, creates the user, updates session to `success` |
| `kiosk/heartbeat` | `handle_heartbeat` | Logs the ping |

To add a new topic:
1. Write `def handle_xyz(topic, payload)` in `mqtt_handlers.py`
2. Add `"xyz": handle_xyz` to `TOPIC_HANDLERS`

---

## Kiosk Registration Flow

```
Frontend                    Backend                      Kiosk
   |                           |                            |
   |-- POST /kiosk/prepare --> |                            |
   |<-- { session_id } -------|                            |
   |                           |-- MQTT: wait for scan ---> |
   |-- poll GET /status ---->  |                            |
   |                           |           <-- kiosk/register_card { uid } --|
   |                           |-- create user, mark success                  |
   |<-- { token, user } -------|                            |
```

---

## Seeding Sample Data

Canonical seed now writes directly to database tables (not via HTTP API) and
covers all v2 canonical tables.

```bash
python ../scripts/seed/seed_data.py
```

If canonical tables already contain data, clear and reseed:

```bash
python ../scripts/seed/seed_data.py --reset
```

Seed against a specific database target:

```bash
python ../scripts/seed/seed_data.py --database-url "postgresql://user:pass@host:5432/dbname"
```

## Creating an Admin User

```bash
python ../scripts/admin/create_admin.py
```

---

## Troubleshooting

### `ModuleNotFoundError: No module named 'dotenv'`
Dependencies are not installed:
```bash
pip install -r requirements.txt
```

### Server starts but DB errors appear
Delete the stale SQLite file and let the server recreate it:
```bash
del inventory.db
python -m app.main
```

### `No module named 'PIL'`
```bash
pip install Pillow
```

### MQTT not connecting
- Confirm `MOSQUITTO_TCP_HOST`, `MOSQUITTO_TCP_PORT`, `MOSQUITTO_USER`, and `JWT_SECRET` are set in `.env`
- The backend uses `JWT_SECRET` as the MQTT password (broker must be configured to accept it)
- MQTT connection failures are non-fatal — the API continues running without it

---

## Full API Reference
See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint details.


---

## What Was Added

### Image Upload Feature
- **Admin capability**: Upload images for inventory items
- **Endpoint**: `POST /api/item-types/{item_type_id}/images`
- **Supported formats**: JPG, JPEG, PNG, GIF, WEBP
- **Storage**: Images saved to `uploads/items/` directory
- **Serving**: Static files served at `/uploads/items/{filename}`

### Inventory and Occupancy Listing
- **User view**: Read event history and occupancy from canonical inventory APIs
- **Endpoints**:
  - `GET /api/inventory/events`
  - `GET /api/inventory/occupancy/location/{location_id}`
  - `GET /api/inventory/occupancy/unit/{unit_id}`

### Database Changes
- Added `image_url` field to Item model
- Database will auto-migrate on first run

---

## Testing the Features

### Upload an Image (Admin)
```bash
# First, create an item
curl -X POST "http://localhost:3000/api/item-types" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "TEST001",
    "name": "Test Item",
    "location": "A1-001",
    "available": true
  }'

# Then upload an image
curl -X POST "http://localhost:3000/api/item-types/1/images" \
  -F "image_file=@path/to/image.jpg"
```

### View Inventory and Occupancy (User)
```bash
# List inventory events
curl "http://localhost:3000/api/inventory/events"

# Check occupancy in one storage location
curl "http://localhost:3000/api/inventory/occupancy/location/1"
```

---

## File Structure
```
backend/
├── uploads/              # Auto-created on first run
│   └── items/           # Item images stored here
├── app/
│   └── routes/
│       ├── item_types_api.py   # Item type CRUD + image upload endpoint
│       └── inventory_api.py    # Canonical event and occupancy endpoints
├── main.py              # Compatibility entry point
├── app/main.py          # Updated with static file serving
└── requirements.txt     # Added python-multipart & Pillow
```

---

## Next Steps

### Frontend Integration
The frontend can now:
1. Display item images using the `image_url` field
2. Read inventory history and occupancy from canonical inventory endpoints
3. Allow admins to upload images via file upload form

### Recommended Frontend Changes
- **User Dashboard**: Add storage location selector and occupancy-aware item grid
- **Admin Dashboard**: Add image upload form to item management page

---

## Security Considerations

⚠️ **Before production deployment:**
1. Add authentication/authorization for admin endpoints
2. Implement file size limits for uploads
3. Add image compression/optimization
4. Restrict CORS origins
5. Add rate limiting for upload endpoints

---

## Troubleshooting

### Import Error: No module named 'PIL'
```bash
pip install Pillow
```

### Upload Directory Not Found
The directory is auto-created on startup. If issues persist:
```bash
mkdir -p uploads/items
```

### Database Schema Issues
Delete and recreate the database:
```bash
rm inventory.db
python -m app.main
```

---

## Full API Documentation
See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint reference.

