# Smart Inventory API Documentation (v2 Canonical)

This document describes the active backend API routes implemented in:
- backend/app/main.py
- backend/app/routes/auth.py
- backend/app/routes/users_api.py
- backend/app/routes/storage_api.py
- backend/app/routes/access_sessions_api.py
- backend/app/routes/inventory_api.py
- backend/app/routes/item_types_api.py
- backend/app/routes/observations_api.py
- backend/app/routes/audit_logs.py
- backend/app/routes/kiosk_api.py

For strict integration rules and naming policy, see API_CONTRACT.md.

## Base URL
- Local: http://localhost:3000
- Swagger: /docs

## Authentication

### POST /api/auth/login
Authenticate with email/password.

Request:
```json
{
  "email": "admin@example.com",
  "password": "secret"
}
```

Response:
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "nfc_card_uid": "CARD_UID",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin",
    "active": true,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### GET /api/auth/me
Get current user from bearer token.

Response fields follow canonical user naming:
- `nfc_card_uid`
- `active`

### POST /api/auth/kiosk/prepare_registration
Prepare kiosk registration flow for a card tap.

### GET /api/auth/kiosk/status/{kiosk_id}
Get auth registration status for a kiosk.

## Users

### POST /api/users
Create user.

Request:
```json
{
  "nfc_card_uid": "04AABBCCDD",
  "name": "Alice",
  "email": "alice@example.com",
  "password": "password123",
  "role": "user"
}
```

### GET /api/users
List users.

### GET /api/users/{user_id}
Get user by numeric ID.

### GET /api/users/by-nfc/{nfc_card_uid}
Get user by NFC card UID.

### PATCH /api/users/{user_id}
Update user.

### DELETE /api/users/{user_id}
Delete user.

## Item Types

### POST /api/item-types
Create item type.

Request:
```json
{
  "name": "ESP32"
}
```

### GET /api/item-types
List item types (includes images list in response).

### GET /api/item-types/{item_type_id}
Get item type detail by ID.

### PATCH /api/item-types/{item_type_id}
Update item type fields.

### DELETE /api/item-types/{item_type_id}
Delete item type.

### POST /api/item-types/{item_type_id}/images
Upload image for item type.
Form fields:
- `image_file` (file, required)
- `is_primary` (boolean query param, optional)

## Storage

### POST /api/storage/units
Create storage unit.

Request:
```json
{
  "unit_type": "drawer",
  "layout_type": "grid"
}
```

### GET /api/storage/units
List storage units.

### GET /api/storage/units/{unit_id}
Get one storage unit.

### PATCH /api/storage/units/{unit_id}
Update storage unit.

### POST /api/storage/locations
Create storage location.

Grid request example:
```json
{
  "unit_id": 1,
  "level_no": 0,
  "row_no": 1,
  "col_no": 2
}
```

### GET /api/storage/units/{unit_id}/locations
List locations in one unit.

### GET /api/storage/locations/{location_id}
Get one location.

### DELETE /api/storage/locations/{location_id}
Delete location.

## Access Sessions

### POST /api/sessions
Open new session.

Request:
```json
{
  "user_id": 1,
  "unit_id": 1
}
```

### GET /api/sessions
List sessions (optional filters: user_id, unit_id, status).

### GET /api/sessions/{session_id}
Get one session.

### POST /api/sessions/{session_id}/close
Close session.

### GET /api/sessions/user/{user_id}/active
Get latest active session for a user.

## Observations

### POST /api/observations
Create sensor observation.

### GET /api/observations
List observations with filters.

### GET /api/observations/{observation_id}
Get one observation.

### PATCH /api/observations/{observation_id}
Update review fields on observation.

### POST /api/observations/rfid-details
Create RFID detail for RFID observation.

### GET /api/observations/rfid-details/{observation_id}
Get RFID detail.

### POST /api/observations/vision-details
Create vision detail for vision observation.

### GET /api/observations/vision-details/{observation_id}
Get vision detail.

### GET /api/observations/session/{session_id}/needs-review
Get observations that need review in session.

## Inventory

### POST /api/inventory/events
Create inventory event (business truth).

Request:
```json
{
  "session_id": 10,
  "user_id": 1,
  "item_type_id": 2,
  "event_type": "borrow",
  "quantity": 1,
  "location_id": 55,
  "observation_id": null,
  "note": "manual"
}
```

### GET /api/inventory/events
List inventory events with filters.

### GET /api/inventory/events/{event_id}
Get event by ID.

### GET /api/inventory/occupancy/location/{location_id}
Get occupancy for one location.

### GET /api/inventory/occupancy/unit/{unit_id}
Get occupancy for all locations in unit.

## Audit Logs

### POST /api/audit-logs
Create audit log.

### GET /api/audit-logs
List audit logs.

### GET /api/audit-logs/recent
Get recent audit logs.

### GET /api/audit-logs/cabinet-access/recent
Get recent unlock/lock/scan logs.

## Kiosk Status

### GET /api/kiosk/status
List kiosk status snapshots.

### GET /api/kiosk/status/{kiosk_id}
Get one kiosk status snapshot by kiosk ID.

## Deprecated Contracts

Removed non-canonical contracts are intentionally not listed in this document.
New code must use only the canonical endpoint groups documented above.
