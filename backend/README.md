# Smart Inventory Backend (FastAPI)

Backend service for the v2 canonical inventory model.

## Canonical Model Policy

This backend uses one canonical model set:
- users
- item_types
- storage_units
- storage_locations
- access_sessions
- observations
- inventory_events
- slot_occupancies
- audit_logs

Do not add parallel Drawer* entities.

## Start

```bash
cd backend
python -m app.main
```

- API base: http://localhost:3000
- Swagger: http://localhost:3000/docs

## Active Routers

- /api/auth
- /api/users
- /api/item-types
- /api/storage
- /api/sessions
- /api/observations
- /api/inventory
- /api/audit-logs

## Source of Truth Docs

- Contract: ../docs/backend/API_CONTRACT.md
- Endpoint reference: ../docs/backend/API_DOCUMENTATION.md
- Table guide: ../docs/backend/DATABASE_TABLE_GUIDE.md

## MQTT Topics (Current)

Kiosk publishes:
- kiosk/open_cabinet
- kiosk/register_card
- kiosk/heartbeat

Backend publishes:
- kiosk/response

## Development Rule

When API contract changes, update in the same PR:
1. route/schema code
2. frontend API client
3. docs
4. tests
