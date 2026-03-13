# Frontend Route Map

This document summarizes the active route structure in the Next.js App Router.
All route groups are organizational only and do not appear in URLs.

## Route Groups

- `(protected)`: Main in-app experience after entering the app shell.
- `(auth)`: Login and registration experience.
- `(external)`: External flows launched outside normal app navigation (e.g., kiosk QR flow).
- `(legacy)`: Backward-compatibility routes and redirects.

## URL Map

### Public/Auth
- `/login` -> `frontend/src/app/(auth)/login/page.tsx`
- `/register` -> `frontend/src/app/(auth)/register/page.tsx`
- `/register/tap-card` -> `frontend/src/app/(auth)/register/tap-card/page.tsx`

### Main Protected App
- `/` -> `frontend/src/app/(protected)/page.tsx`
- `/borrowed` -> `frontend/src/app/(protected)/borrowed/page.tsx`
- `/history` -> `frontend/src/app/(protected)/history/page.tsx`
- `/profile` -> `frontend/src/app/(protected)/profile/page.tsx`
- `/cabinets` -> `frontend/src/app/(protected)/cabinets/page.tsx`

### Admin (inside protected)
- `/admin` -> `frontend/src/app/(protected)/admin/page.tsx`
- `/admin/inventory` -> `frontend/src/app/(protected)/admin/inventory/page.tsx`
- `/admin/hardware` -> `frontend/src/app/(protected)/admin/hardware/page.tsx`
- `/admin/loans` -> `frontend/src/app/(protected)/admin/loans/page.tsx`
- `/admin/users` -> `frontend/src/app/(protected)/admin/users/page.tsx`
- `/admin/logs` -> `frontend/src/app/(protected)/admin/logs/page.tsx`

### External/Kiosk Flow
- `/kiosk/register` -> `frontend/src/app/(external)/kiosk/register/page.tsx`

### Legacy
- `/loans` -> redirect to `/admin/loans`
  - Source: `frontend/src/app/(legacy)/loans/page.tsx`

## Supporting Routes
- `/api/*` proxy route -> `frontend/src/app/api/[...path]/route.ts`

## Backend Contract Notes

Frontend must call canonical backend routes only via `/api/*` proxy.

Canonical groups:
- `/api/auth/*`
- `/api/users/*`
- `/api/item-types/*`
- `/api/storage/*`
- `/api/sessions/*`
- `/api/observations/*`
- `/api/inventory/*`
- `/api/audit-logs/*`

Do not add new calls to removed legacy groups such as `/api/compartments/*`, `/api/items/*`, or `/api/loans/*`.

## Layout Binding
- Root layout (global providers/styles): `frontend/src/app/layout.tsx`
- Protected app shell layout: `frontend/src/app/(protected)/layout.tsx`

## Notes For Team
- Rename route groups freely for clarity; URLs remain unchanged.
- Prefer adding new authenticated pages under `(protected)`.
- Use `(external)` for flows entered by QR, hardware, or third-party callbacks.
- Keep old paths in `(legacy)` with explicit redirects when needed.
