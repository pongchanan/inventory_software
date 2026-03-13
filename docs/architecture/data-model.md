# Data Model

This section summarizes the active canonical v2 model.

## Core Entities

- `users`: system users and NFC identity.
- `item_types`: equipment categories (not per-item RFID identity).
- `item_type_images`: reference images for each item type.
- `storage_units`: physical containers (drawer/shelf/hanger).
- `storage_locations`: grid/zone locations inside units.
- `access_sessions`: open-close lifecycle for one user and one unit.
- `observations`: raw sensor/vision evidence entries.
- `rfid_observation_details`: detail payload for RFID observations.
- `vision_observation_details`: detail payload for vision observations.
- `inventory_events`: business truth (borrow/return/etc).
- `slot_occupancies`: current occupancy cache by location.
- `audit_logs`: trace log for actions/results.

## Key Relationships

- one `storage_unit` -> many `storage_locations`
- one `user` -> many `access_sessions`
- one `access_session` -> many `observations`
- one `observation` -> zero/one detail row in rfid or vision table
- one `access_session` -> many `inventory_events`
- one `storage_location` -> one `slot_occupancy` current record

## Business Truth vs Evidence

- Evidence: `observations` (+ detail tables)
- Business truth: `inventory_events`

Only `inventory_events` should drive official borrow/return history and quantity updates.

## Naming Policy

Use `storage_location` and `access_session` in all new contracts.
Do not reintroduce parallel `drawer_slot` or `drawer_session` data models.

