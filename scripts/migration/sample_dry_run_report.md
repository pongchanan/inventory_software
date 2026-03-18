# Dry-Run Migration Report: migrate_to_v2.py
Generated: 2026-03-18T09:50:47.676424

## Summary

- **Total Operations**: 11
- **Would Execute**: 4
- **Skipped**: 7
- **Total Rows to Migrate**: 30

## Operations

| Source | Target | Source Count | Status | Description |
|--------|--------|--------------|--------|-------------|
| Apply schema_v2.sql (51 statements) |  | 0 | would_execute | Apply schema_v2.sql (51 statements) |
| users | v2.users | 3 | would_execute | Migrating 3 user records |
| item_types | v2.item_types | 27 | would_execute | Migrating 27 item types |
| item_type_images | v2.item_type_images | 0 | would_execute | Migrating 0 item type images |
| drawers | v2.storage_units | 0 | skipped | Skipped: source table missing |
| drawer_slots | v2.storage_locations | 0 | skipped | Skipped: source table missing |
| drawer_sessions | v2.access_sessions | 0 | skipped | Skipped: source table missing |
| detection_events | v2.observations + v2.vision_observation_details | 0 | skipped | Skipped: source table missing |
| inventory_events | v2.inventory_events | 0 | skipped | Skipped: source table missing |
| audit_logs | v2.audit_logs | 0 | skipped | Skipped: source table missing |
| slot_occupancies | v2.slot_occupancies | 0 | skipped | Skipped: source table missing |

## Warnings

- ⚠️  Source table 'drawers' not found or inaccessible; skipping this operation
- ⚠️  Source table 'drawer_slots' not found or inaccessible; skipping this operation
- ⚠️  Source table 'drawer_sessions' not found or inaccessible; skipping this operation
- ⚠️  Source table 'detection_events' not found or inaccessible; skipping this operation
- ⚠️  Source table 'inventory_events' not found or inaccessible; skipping this operation
- ⚠️  Source table 'audit_logs' not found or inaccessible; skipping this operation
- ⚠️  Source table 'slot_occupancies' not found or inaccessible; skipping this operation
