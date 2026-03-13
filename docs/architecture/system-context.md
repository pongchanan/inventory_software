# System Context

This document defines the current high-level system boundary for the inventory platform.

## Actors

- User: taps NFC card and interacts with drawer session.
- Admin: manages users, item types, storage layout, and exception handling.
- Kiosk (ESP32): controls lock/sensor hardware and communicates events.
- Vision services (controller + inference): analyze images and produce confidence-based changes.

## Main Components

- Frontend (Next.js): web UI for users/admin.
- Backend (FastAPI): canonical API and business event processing.
- Database (SQLite local / PostgreSQL production): canonical v2 tables.
- Kiosk firmware: hardware state and MQTT publishing.
- MQTT broker: realtime event transport between kiosk and backend.
- Vision controller/inference: image capture orchestration and CV inference pipeline.

## Canonical Data Language

Use these domain names in new implementations:

- `storage_unit` (drawer/shelf physical container)
- `storage_location` (slot/zone inside unit)
- `access_session` (open-close interaction lifecycle)
- `observation` (raw sensor or vision evidence)
- `inventory_event` (business truth)
- `slot_occupancy` (current state cache)

## Integration Boundary

- Frontend and kiosk call backend APIs/contracts only.
- Vision services publish analysis through backend-facing contract, not direct DB writes.
- Backend is the only service that commits business truth (`inventory_events`).

## Non-Goals

- No new parallel `Drawer*` schema branch.
- No endpoint contracts outside canonical router groups.

