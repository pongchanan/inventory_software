# Admin Tracking Features

## Overview
This document summarizes the current tracking features that are implemented for
loan visibility and cabinet access visibility.

## Backend (Fact-Checked)

### Inventory event source (loan-tracking basis)
Source: `backend/app/routes/inventory_api.py`

- `GET /api/inventory/events`
  - Canonical source for `borrow` / `return` event stream
  - Supports filters via query params in backend service

### Audit log detail endpoint
Source: `backend/app/routes/audit_logs.py`

- `GET /api/audit-logs/cabinet-access/recent`
  - Filters to `unlock`, `lock`, `scan`
  - Supports `hours` and `limit`
  - Resolves `user_name` from UID

## Frontend (Fact-Checked)

### API client
Source: `frontend/src/lib/api_client/*.ts`

Implemented API functions:
- `fetchLoanDetails(statusFilter?)` (derived client-side from `GET /api/inventory/events`)
- `fetchActiveLoanDetails()` (derived client-side from `GET /api/inventory/events`)
- `fetchCabinetAccessLogs(hours)`

### Admin UI placement
Current UI is split by pages, not tab sections inside one page:
- `frontend/src/app/(protected)/admin/page.tsx` (dashboard summary)
- `frontend/src/app/(protected)/admin/loans/page.tsx` (loan tracking)
- `frontend/src/app/(protected)/admin/logs/page.tsx` (cabinet access logs)

## Important Note on Access Control

- Frontend routes are admin-gated by the auth context.
- Some backend handlers may not be individually wrapped with `require_admin` in
  route definitions, so API-level role enforcement should be reviewed
  separately if strict server-side authorization is required.


