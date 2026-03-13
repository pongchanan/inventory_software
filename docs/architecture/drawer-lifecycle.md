# Drawer Lifecycle

This lifecycle is the canonical behavior shared by firmware, backend, frontend, and vision integration.

## States

1. `idle`: no active user session.
2. `auth_pending`: user card scanned, authorization in progress.
3. `session_open`: backend created `access_session`.
4. `wait_open`: waiting drawer open confirmation.
5. `wait_close`: waiting drawer fully closed confirmation.
6. `capture_pending`: closure confirmed, capture conditions settling.
7. `analysis_pending`: image sent for diff/classification.
8. `resolved_success`: backend accepted event results.
9. `resolved_error`: confidence or quality failed, recovery needed.
10. `session_closed`: backend closed `access_session`.

## Transition Rules

- `idle -> auth_pending`: card tap received.
- `auth_pending -> session_open`: auth success and open session API succeeds.
- `session_open -> wait_open`: lock command issued.
- `wait_open -> wait_close`: drawer-open sensor detected.
- `wait_close -> capture_pending`: drawer closed sensor stable.
- `capture_pending -> analysis_pending`: image captured and submitted.
- `analysis_pending -> resolved_success`: backend receives confident and valid result.
- `analysis_pending -> resolved_error`: low confidence, missing image, or invalid mapping.
- `resolved_success -> session_closed`: close session API succeeds.
- `resolved_error -> wait_open`: optional recovery path requires reopen.

## Constraints

- Capture is allowed only when drawer is confirmed closed and lighting is stable.
- Session must not be marked closed before backend decision.
- Unresolved low-confidence flow must be visible to admin and recoverable.

