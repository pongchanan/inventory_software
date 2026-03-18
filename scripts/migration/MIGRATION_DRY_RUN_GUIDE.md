# Migration Dry-Run Report Guide

## Overview

The migration scripts have been enhanced to support readable, structured dry-run reports. This allows you to preview what changes will be made to your database before actually executing the migration.

## Features

### Dry-Run Report Capabilities
- **Structured Operation Tracking**: Each migration step is tracked with source/target tables and row counts
- **Multiple Output Formats**: ASCII tables (terminal-friendly), JSON (machine-readable), Markdown (documentation)
- **Summary Statistics**: Total operations, operations to execute, skipped operations, and row counts
- **Warnings and Errors**: Issues detected during migration planning
- **Human-Readable Tables**: ASCII table output with proper column formatting

## Usage

### Basic Dry-Run (Print to Terminal)

#### migrate_to_v2.py
```bash
cd scripts/migration
python migrate_to_v2.py --dry-run
```

#### drop_legacy_tables_now.py
```bash
python drop_legacy_tables_now.py --dry-run
```

#### add_item_type_event_columns.py
```bash
python add_item_type_event_columns.py --dry-run
```

### Dry-Run with Report Export

#### Save as ASCII (plain text)
```bash
python migrate_to_v2.py --dry-run --report migration_report.txt
```

#### Save as JSON (machine-readable)
```bash
python migrate_to_v2.py --dry-run --report migration_report.json
```

#### Save as Markdown (documentation)
```bash
python migrate_to_v2.py --dry-run --report migration_report.md
```

### Execute Migration

```bash
python migrate_to_v2.py --execute
```

## Report Interpretation

### ASCII Table Format

```
========================================================
DRY-RUN MIGRATION REPORT: migrate_to_v2.py
Generated: 2026-03-18T10:30:00.123456
========================================================

Source → Target           | Source Count | Target Count | Status        | Description
--------------------------------------------------
users → v2.users          |         123  |            0 | would_execute | Migrating 123 user records
item_types → v2.item_types|          45  |            0 | would_execute | Migrating 45 item types
drawers → v2.storage_units|          12  |            0 | would_execute | Migrating 12 storage units
--

SUMMARY
--------------------------------------------------
Total Operations:      12
Would-Execute:         12
Skipped:               0
Total Source Rows:     3,456
Total Target Rows:     0

WARNINGS
--------------------------------------------------
⚠️  No v2 schema detected; will be created
```

### Key Columns
- **Source → Target**: Tables involved in the migration
- **Source Count**: Rows in the source table
- **Target Count**: Rows currently in the target table (usually 0 on first run)
- **Status**: 
  - `would_execute` - Will run during actual migration
  - `skipped` - No action needed (e.g., column already exists)
  - `pending` - Awaiting execution
- **Description**: Human-readable operation summary

### Summary Statistics
- **Total Operations**: All migration operations planned
- **Would-Execute**: Operations that will run with `--execute`
- **Skipped**: Operations that won't run (already done or no-ops)
- **Total Source Rows**: Total records to be migrated
- **Total Target Rows**: Current rows in target tables

## JSON Report Format

```json
{
  "script_name": "migrate_to_v2.py",
  "timestamp": "2026-03-18T10:30:00.123456",
  "database_url": "postgresql://...",
  "statistics": {
    "total_operations": 12,
    "would_execute": 12,
    "skipped": 0,
    "total_source_rows": 3456,
    "total_target_rows": 0
  },
  "operations": [
    {
      "operation_type": "table_migrate",
      "source_table": "users",
      "target_table": "v2.users",
      "source_row_count": 123,
      "target_row_count": 0,
      "description": "Migrating 123 user records",
      "status": "would_execute"
    }
  ],
  "warnings": [],
  "errors": []
}
```

## Markdown Report Format

Generates a readable markdown document with tables, suitable for documentation or sharing.

```markdown
# Dry-Run Migration Report: migrate_to_v2.py
Generated: 2026-03-18T10:30:00.123456

## Summary

- **Total Operations**: 12
- **Would Execute**: 12
- **Skipped**: 0
- **Total Rows to Migrate**: 3,456

## Operations

| Source | Target | Source Count | Status | Description |
|--------|--------|--------------|--------|-------------|
| users | v2.users | 123 | would_execute | Migrating 123 user records |
...
```

## Workflow

### Recommended Migration Workflow

1. **Preview with ASCII Report** (instant feedback)
   ```bash
   python migrate_to_v2.py --dry-run
   ```

2. **Export Detailed Report** (for documentation/review)
   ```bash
   python migrate_to_v2.py --dry-run --report pre_migration_report.md
   ```

3. **Review the Report** (check for warnings/errors)
   - Look at total row counts
   - Check for any warnings or errors
   - Verify source/target tables are correct

4. **Execute Migration** (when ready)
   ```bash
   python migrate_to_v2.py --execute
   ```

5. **Verify Results** (optional - run dry-run again to see updated counts)
   ```bash
   python migrate_to_v2.py --dry-run
   ```

## Migration Scripts

### migrate_to_v2.py
Migrates data from public schema to v2 schema.

**Tables Migrated:**
- users → v2.users
- item_types → v2.item_types
- item_type_images → v2.item_type_images
- drawers → v2.storage_units
- drawer_slots → v2.storage_locations
- drawer_sessions → v2.access_sessions
- detection_events → v2.observations + v2.vision_observation_details
- inventory_events → v2.inventory_events
- audit_logs → v2.audit_logs
- slot_occupancies → v2.slot_occupancies

### drop_legacy_tables_now.py
Drops legacy tables that are no longer needed.

**Tables Dropped:**
- Legacy tables: approvals, compartments, transactions, loans, items, etc.
- Compat tables: legacy_users, legacy_items, legacy_item_types, legacy_loans

### add_item_type_event_columns.py
Adds new columns to legacy tables for backward compatibility.

**Columns Added:**
- transactions: item_type_id, quantity, slot_id, session_id, detection_event_id
- loans: item_type_id, quantity, slot_id, source_action

## Troubleshooting

### Issue: "No operations to migrate"
- The migration has already been completed
- Run the script again to verify current state

### Issue: Warnings about missing tables
- Source tables may have already been deleted
- This is normal if running on a clean environment
- Migration will skip missing tables gracefully

### Issue: High row counts
- Verify the source data is as expected
- Run the dry-run report before executing
- Consider creating a backup before executing

## Integration with CI/CD

### Running Migrations in Pipeline

1. **Check for migration requirements:**
   ```bash
   python migrate_to_v2.py --dry-run > migration_check.log 2>&1
   grep "would_execute" migration_check.log
   ```

2. **Generate report for approval:**
   ```bash
   python migrate_to_v2.py --dry-run --report migration_report.json
   ```

3. **Execute only if approved:**
   ```bash
   python migrate_to_v2.py --execute
   ```

## Module: dry_run_report.py

The `dry_run_report.py` module provides the reporting infrastructure.

### Key Classes

#### DryRunReport
Main report accumulator with methods:
- `add_operation()`: Add a migration operation
- `add_warning()`: Add a warning message
- `add_error()`: Add an error message
- `to_ascii_table()`: Generate ASCII table
- `to_json()`: Generate JSON output
- `to_markdown()`: Generate Markdown output
- `print_ascii()`: Print table to stdout
- `save_report()`: Save report to file

#### MigrationOperation
Represents a single migration step with:
- Operation type (SCHEMA_CREATE, TABLE_MIGRATE, TABLE_DROP, etc.)
- Source and target table names
- Row counts
- Status (would_execute, skipped, pending)

## See Also

- [DATABASE_TABLE_GUIDE.md](../docs/backend/DATABASE_TABLE_GUIDE.md)
- [API_DOCUMENTATION.md](../docs/backend/API_DOCUMENTATION.md)
- [SETUP_GUIDE.md](../docs/backend/SETUP_GUIDE.md)
