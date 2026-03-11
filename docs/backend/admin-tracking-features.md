# Admin Tracking Features

## Overview
This document summarizes the current tracking features that are implemented for
loan visibility and cabinet access visibility.

## Backend (Fact-Checked)

### Loan detail endpoints
Source: `backend/app/routes/loans.py`

- `GET /api/inventory/events/details/all`
  - Returns enriched loan rows with user/item fields
  - Supports `status_filter`, `skip`, and `limit`
- `GET /api/inventory/events/details/active`
  - Returns active loan details
  - Supports `user_uid` and `item_type_id`
  - Marks overdue loans when `due_at < now`
- `GET /api/inventory/events/details/user/{user_uid}`
  - Returns detailed history for one user
  - Supports `include_returned`

`LoanDetail` currently includes these notable fields beyond the legacy model:
- `item_type_id`, `item_type_name`
- `quantity`, `slot_id`, `source_action`
- `item_image_url`

### Audit log detail endpoint
Source: `backend/app/routes/audit_logs.py`

- `GET /api/audit-logs/cabinet-access/recent`
  - Filters to `unlock`, `lock`, `scan`
  - Supports `hours` and `limit`
  - Resolves `user_name` from UID

## Frontend (Fact-Checked)

### API client
Source: `frontend/src/lib/api.ts`

Implemented API functions:
- `fetchLoanDetails(statusFilter?)`
- `fetchActiveLoanDetails()`
- `fetchCabinetAccessLogs(hours)`

### Admin UI placement
Current UI is split by pages, not tab sections inside one page:
- `frontend/src/app/(app)/admin/page.tsx` (dashboard summary)
- `frontend/src/app/(app)/admin/loans/page.tsx` (loan tracking)
- `frontend/src/app/(app)/admin/logs/page.tsx` (cabinet access logs)

## Important Note on Access Control

- Frontend routes are admin-gated by the auth context.
- These backend handlers are not individually wrapped with `require_admin` in
  the route definitions above, so API-level role enforcement should be reviewed
  separately if strict server-side authorization is required.


