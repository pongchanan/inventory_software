# API Contract (Canonical)

Last updated: 2026-03-13

This document is the single contract source for Backend, Frontend, Kiosk, and Vision integrations.

## 1) Contract Rules

1. Use v2 canonical domain names only: `storage_units`, `storage_locations`, `access_sessions`, `observations`, `inventory_events`.
2. Do not introduce new parallel `Drawer*` entities in backend code or docs.
3. Any API change must be updated in the same PR across:
   - backend route/schema
   - frontend API client
   - docs
   - tests

## 2) Canonical Endpoints

### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/kiosk/prepare_registration`
- `GET /api/auth/kiosk/status/{kiosk_id}`

### Users
- `POST /api/users`
- `GET /api/users`
- `GET /api/users/{user_id}`
- `GET /api/users/by-nfc/{nfc_card_uid}`
- `PATCH /api/users/{user_id}`
- `DELETE /api/users/{user_id}`

### Item Types
- `POST /api/item-types`
- `GET /api/item-types`
- `GET /api/item-types/{item_type_id}`
- `PATCH /api/item-types/{item_type_id}`
- `DELETE /api/item-types/{item_type_id}`

### Storage
- `POST /api/storage/units`
- `GET /api/storage/units`
- `GET /api/storage/units/{unit_id}`
- `PATCH /api/storage/units/{unit_id}`
- `POST /api/storage/locations`
- `GET /api/storage/units/{unit_id}/locations`
- `GET /api/storage/locations/{location_id}`
- `DELETE /api/storage/locations/{location_id}`

### Access Sessions
- `POST /api/sessions`
- `GET /api/sessions`
- `GET /api/sessions/{session_id}`
- `POST /api/sessions/{session_id}/close`
- `GET /api/sessions/user/{user_id}/active`

### Observations
- `POST /api/observations`
- `GET /api/observations`
- `GET /api/observations/{observation_id}`
- `PATCH /api/observations/{observation_id}`
- `POST /api/observations/rfid-details`
- `GET /api/observations/rfid-details/{observation_id}`
- `POST /api/observations/vision-details`
- `GET /api/observations/vision-details/{observation_id}`
- `GET /api/observations/session/{session_id}/needs-review`

### Inventory
- `POST /api/inventory/events`
- `GET /api/inventory/events`
- `GET /api/inventory/events/{event_id}`
- `GET /api/inventory/occupancy/location/{location_id}`
- `GET /api/inventory/occupancy/unit/{unit_id}`

### Audit Logs
- `POST /api/audit-logs`
- `GET /api/audit-logs`
- `GET /api/audit-logs/{log_id}`
- `GET /api/audit-logs/recent`
- `GET /api/audit-logs/cabinet-access/recent`

## 3) Canonical Request/Response Schemas

These are the minimum fields that integrations must follow.

### `POST /api/auth/login`
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
    "uid": "CARD_UID",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin",
    "authorized": true,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### `POST /api/item-types`
Request:
```json
{
  "name": "ESP32"
}
```
Response:
```json
{
  "id": 1,
  "name": "ESP32",
  "active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

### `POST /api/storage/units`
Request:
```json
{
  "unit_type": "drawer",
  "layout_type": "grid"
}
```

### `POST /api/storage/locations`
Request (grid):
```json
{
  "unit_id": 1,
  "level_no": 0,
  "row_no": 2,
  "col_no": 3
}
```

### `POST /api/sessions`
Request:
```json
{
  "user_id": 1,
  "unit_id": 1
}
```

### `POST /api/observations`
Request:
```json
{
  "session_id": 100,
  "location_id": 203,
  "source_type": "vision",
  "change_type": "changed",
  "confidence": 0.92
}
```

### `POST /api/inventory/events`
Request:
```json
{
  "session_id": 100,
  "user_id": 1,
  "item_type_id": 5,
  "event_type": "borrow",
  "quantity": 1,
  "location_id": 203,
  "observation_id": 999,
  "note": "vision-confirmed"
}
```

## 4) Event Vocabulary (Canonical)

The canonical event vocabulary for `inventory_events.event_type`:

- `borrow`: item removed by user flow.
- `return`: item added by user flow.
- `adjustment`: manual stock correction.
- `unknown_change`: change detected but type is not trusted.
- `manual_resolution`: admin resolved a previous uncertain event.

Notes:
- Current backend logic still accepts `added`/`removed` aliases for occupancy transitions.
- New integrations should emit canonical values above.

## 5) Kiosk Session State Machine (Canonical)

State machine for firmware and backend orchestration:

1. `idle`
2. `auth_pending`
3. `session_open`
4. `wait_open`
5. `wait_close`
6. `capture_pending`
7. `analysis_pending`
8. `resolved_success` or `resolved_error`
9. `session_closed`

Behavior constraints:
- Capture is valid only after drawer is confirmed closed and light is stable.
- Session close is valid only after backend decision.
- If confidence is low, state goes to `resolved_error` and recovery flow is required.

## 6) Legacy-to-Canonical Mapping

| Legacy Term | Canonical Term |
|---|---|
| drawer | storage_unit (unit_type=`drawer`) |
| drawer_slot | storage_location (grid row/col) |
| drawer_session | access_session |
| drawer_snapshot | observation + vision_observation_details |
| detection_event | observation (vision) + inventory_event |
| exception_case | observation.review_status / audit log note (until dedicated endpoint) |
| user_uid in APIs | user_id (except auth token subject) |
| slot_id in new APIs | location_id |

## 7) Compatibility Policy

1. Frontend and kiosk clients must call canonical endpoints only.
2. Any old endpoint references in docs/tests are a bug.
3. Compatibility shims are temporary and must not be used in new code.
