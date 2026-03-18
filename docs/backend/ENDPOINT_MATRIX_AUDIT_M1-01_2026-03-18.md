# M1-01 Endpoint Matrix Audit

Owner: A + E  
Audit date: 2026-03-18  
Scope: Canonical `/api/*` endpoints only (excludes `/` and `/health`)

## 1) Frontend-Called Endpoints (Fact-Checked)

The table below lists every endpoint currently called by frontend code.

| Method | Endpoint | Frontend call sites | Backend route exists | In contract/docs | Result |
|---|---|---|---|---|---|
| GET | `/api/users` | `frontend/src/lib/api_client/auth.ts` | Yes (`users_api.py`) | Yes | PASS |
| POST | `/api/auth/login` | `frontend/src/lib/api_client/auth.ts` | Yes (`auth.py`) | Yes | PASS |
| GET | `/api/auth/me` | `frontend/src/lib/api_client/auth.ts` | Yes (`auth.py`) | Yes | PASS |
| GET | `/api/item-types` | `frontend/src/lib/api_client/core.ts`, `frontend/src/lib/api_client/items.ts` | Yes (`item_types_api.py`) | Yes | PASS |
| GET | `/api/item-types/{item_type_id}` | `frontend/src/lib/api_client/core.ts`, `frontend/src/lib/api_client/items.ts` | Yes (`item_types_api.py`) | Yes | PASS |
| POST | `/api/item-types` | `frontend/src/lib/api_client/items.ts` | Yes (`item_types_api.py`) | Yes | PASS |
| PATCH | `/api/item-types/{item_type_id}` | `frontend/src/lib/api_client/items.ts` | Yes (`item_types_api.py`) | Yes | PASS |
| DELETE | `/api/item-types/{item_type_id}` | `frontend/src/lib/api_client/items.ts` | Yes (`item_types_api.py`) | Yes | PASS |
| POST | `/api/item-types/{item_type_id}/images` | `frontend/src/lib/api_client/items.ts` | Yes (`item_types_api.py`) | Yes | PASS |
| GET | `/api/storage/units` | `frontend/src/lib/api_client/core.ts` | Yes (`storage_api.py`) | Yes | PASS |
| GET | `/api/storage/units/{unit_id}/locations` | `frontend/src/lib/api_client/core.ts` | Yes (`storage_api.py`) | Yes | PASS |
| GET | `/api/inventory/events` | `frontend/src/lib/api_client/core.ts` | Yes (`inventory_api.py`) | Yes | PASS |
| GET | `/api/inventory/occupancy/location/{location_id}` | `frontend/src/lib/api_client/core.ts` | Yes (`inventory_api.py`) | Yes | PASS |
| GET | `/api/inventory/occupancy/unit/{unit_id}` | `frontend/src/lib/api_client/core.ts` | Yes (`inventory_api.py`) | Yes | PASS |
| GET | `/api/audit-logs/cabinet-access/recent` | `frontend/src/lib/api_client/audit.ts` | Yes (`audit_logs.py`) | Yes | PASS |
| POST | `/api/auth/kiosk/prepare_registration` | `frontend/src/app/(auth)/register/page.tsx`, `frontend/src/app/(external)/kiosk/register/page.tsx` | Yes (`auth.py`) | Yes | PASS |
| GET | `/api/auth/kiosk/status/{kiosk_id}` | `frontend/src/app/(external)/kiosk/register/page.tsx` | Yes (`auth.py`) | Yes | PASS |

Summary:
- Frontend-called endpoints audited: 17
- Backend existence mismatches: 0
- Contract/docs mismatches: 0

## 2) Backend vs Docs Coverage (Canonical Groups)

Canonical groups audited in backend and docs:
- `/api/auth/*`
- `/api/users/*`
- `/api/item-types/*`
- `/api/storage/*`
- `/api/sessions/*`
- `/api/observations/*`
- `/api/inventory/*`
- `/api/audit-logs/*`
- `/api/kiosk/*`

Result: canonical groups now aligned in:
- `docs/backend/API_CONTRACT.md`
- `docs/backend/API_DOCUMENTATION.md`
- `docs/frontend/route-map.md`

## 3) Drift Issues (Opened)

### Critical
- None.

### High
- None.

### Medium
- DRIFT-MED-001: Frontend external kiosk page bypasses Next.js `/api/*` proxy and calls backend URL directly (`NEXT_PUBLIC_API_URL`).
  - Evidence:
    - `frontend/src/app/(external)/kiosk/register/page.tsx` uses direct `${NEXT_PUBLIC_API_URL}/api/...`
    - `docs/frontend/route-map.md` states frontend should call canonical backend routes via `/api/*` proxy.
  - Impact:
    - Inconsistent networking pattern vs documented frontend architecture.
    - Potential CORS/env mismatch risk between environments.
  - Recommendation:
    - Either (A) route external kiosk calls through `/api/*` proxy, or
    - (B) update docs to explicitly allow direct backend calls for external kiosk flow.

## 4) DoD Check

- ระบุทุก endpoint ที่ frontend เรียกจริง: DONE (17 endpoints listed)
- เทียบกับ contract และ docs: DONE (all PASS for endpoint existence and documentation)
- เปิด issue drift พร้อม severity (critical/high/medium): DONE (1 medium issue)
