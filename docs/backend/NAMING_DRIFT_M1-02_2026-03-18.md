# M1-02 Naming Drift Legacy -> Canonical

Owner: A  
Date: 2026-03-18  
Depends on: M1-01 Endpoint Matrix Audit

## Goal

Canonicalize payload/response naming across active API and kiosk payload boundaries.

## Scope

- Auth API payload/response contract (`/api/auth/login`, `/api/auth/me`, `/api/auth/kiosk/status/{kiosk_id}`)
- MQTT kiosk card payload handling (`open_cabinet`, `register_card`)
- Contract and API documentation sync
- Regression test updates

## Breaking Field Changes

### Canonical response fields (removed legacy names)

| Surface | Legacy field | Canonical field | Status |
|---|---|---|---|
| Auth user response | `uid` | `nfc_card_uid` | Removed legacy from API response model |
| Auth user response | `authorized` | `active` | Removed legacy from API response model |

### Compatibility mapping (temporary)

| Surface | Legacy input alias | Canonical target | Policy status |
|---|---|---|---|
| MQTT `open_cabinet` payload | `uid`, `rfid` | `nfc_card_uid` | Temporary mapping retained |
| MQTT `register_card` payload | `uid` | `nfc_card_uid` | Temporary mapping retained |

## Files Changed

- `backend/app/schemas/user.py`
- `backend/app/mqtt_handlers.py`
- `backend/test/test_auth.py`
- `frontend/src/lib/api_client/auth.ts`
- `docs/backend/API_CONTRACT.md`
- `docs/backend/API_DOCUMENTATION.md`

## Contract Updates

- `API_CONTRACT.md`
  - Updated last-updated date to 2026-03-18
  - Updated auth response example to canonical user fields
  - Added compatibility policy clauses for auth and MQTT naming
- `API_DOCUMENTATION.md`
  - Added explicit auth response example with canonical fields
  - Added canonical field note for `/api/auth/me`

## Verification

### Backend automated tests

Command:

`pytest -q` (from `backend/`)

Result:

- 38 passed
- 0 failed

### Frontend API-client tests

Command:

`npm --prefix frontend test -- api.test.ts --runInBand`

Result:

- 17 passed
- 0 failed

## DoD Check

- Breaking fields mapped/removed according to policy: DONE
- Payload/response naming canonical on active contract surfaces: DONE
- Contract/documentation updates complete: DONE
