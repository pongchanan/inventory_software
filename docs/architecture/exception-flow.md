# Exception Flow

Exception flow defines what happens when automation cannot produce trusted inventory events.

## Typical Exception Triggers

- Low confidence classification.
- Unknown object (no match above threshold).
- Multi-object/overlap in one location.
- Blurry/poor lighting image quality.
- Invalid or stale calibration mapping.
- Missing snapshot in close cycle.

## Canonical Handling Steps

1. Keep `access_session` open or mark attention-required path.
2. Record `observation` with `review_status=needs_review`.
3. Record contextual audit log for traceability.
4. Return error decision to kiosk for recovery path.
5. Expose unresolved list in admin workflow.
6. Finalize with either:
	- `manual_resolution` inventory event, or
	- session cancellation/retry.

## Policy

- Do not silently auto-close unresolved sessions.
- Do not overwrite baseline from unresolved cycles.
- Do not emit `borrow`/`return` events from untrusted evidence.

## Future Endpoint Notes

Today, unresolved states are represented via `observations.review_status` and audit logs.
If dedicated exception endpoints are introduced later, they must map back to the same canonical entities and vocabulary.

