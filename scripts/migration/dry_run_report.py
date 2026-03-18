"""Dry-run report generation for migration scripts.

Provides structured, human-readable reporting for migration dry-runs.
"""

import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional
from urllib.parse import urlsplit, urlunsplit


def _trim(value: str, width: int) -> str:
    if len(value) <= width:
        return value.ljust(width)
    if width <= 3:
        return value[:width]
    return (value[: width - 3] + "...")


def _redact_database_url(database_url: str) -> str:
    parts = urlsplit(database_url)
    if not parts.username and not parts.password:
        return database_url

    host = parts.hostname or ""
    if parts.port:
        host = f"{host}:{parts.port}"

    user = parts.username or "user"
    redacted_netloc = f"{user}:***@{host}"
    return urlunsplit((parts.scheme, redacted_netloc, parts.path, parts.query, parts.fragment))


class OperationType(Enum):
    """Types of migration operations."""
    SCHEMA_CREATE = "schema_create"
    TABLE_MIGRATE = "table_migrate"
    TABLE_DROP = "table_drop"
    COLUMN_ADD = "column_add"
    DATA_TRANSFORM = "data_transform"


@dataclass
class MigrationOperation:
    """Single migration operation."""
    operation_type: OperationType
    source_table: Optional[str] = None
    target_table: Optional[str] = None
    source_row_count: int = 0
    target_row_count: int = 0
    description: str = ""
    status: str = "pending"  # pending, skipped, would_execute
    
    def to_dict(self):
        return {
            "operation_type": self.operation_type.value,
            "source_table": self.source_table,
            "target_table": self.target_table,
            "source_row_count": self.source_row_count,
            "target_row_count": self.target_row_count,
            "description": self.description,
            "status": self.status,
        }


@dataclass
class DryRunReport:
    """Collects and formats migration dry-run information."""
    script_name: str
    database_url: str
    operations: List[MigrationOperation] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def add_operation(self, op: MigrationOperation) -> None:
        """Add an operation to the report."""
        self.operations.append(op)
    
    def add_warning(self, message: str) -> None:
        """Add a warning to the report."""
        self.warnings.append(message)
    
    def add_error(self, message: str) -> None:
        """Add an error to the report."""
        self.errors.append(message)
    
    def total_rows_to_migrate(self) -> int:
        """Calculate total rows that would be migrated."""
        return sum(
            op.source_row_count 
            for op in self.operations 
            if op.operation_type == OperationType.TABLE_MIGRATE 
            and op.status != "skipped"
        )
    
    def to_ascii_table(self) -> str:
        """Generate ASCII table representation."""
        if not self.operations:
            return "No operations to migrate."
        
        lines = []
        lines.append("")
        table_width = 88
        lines.append("=" * table_width)
        lines.append(f"DRY-RUN MIGRATION REPORT: {self.script_name}")
        lines.append(f"Generated: {self.timestamp}")
        lines.append("=" * table_width)
        lines.append("")
        
        # Headers
        headers = [
            "Source -> Target",
            "Src",
            "Tgt",
            "Status",
            "Description"
        ]
        col_widths = [28, 6, 6, 12, 24]
        
        # Header row
        header_line = " | ".join(
            h.ljust(w) for h, w in zip(headers, col_widths)
        )
        lines.append(header_line)
        lines.append("-" * table_width)
        
        # Data rows
        for op in self.operations:
            if op.operation_type == OperationType.TABLE_MIGRATE:
                source_target = f"{op.source_table or ''} -> {op.target_table or ''}"
            elif op.operation_type == OperationType.TABLE_DROP:
                source_target = f"DROP: {op.source_table or ''}"
            elif op.operation_type == OperationType.COLUMN_ADD:
                source_target = f"ADD: {op.target_table or ''}.{op.description.split(':')[0]}"
            else:
                source_target = op.description
            
            row = [
                _trim(source_target, col_widths[0]),
                _trim(str(op.source_row_count), col_widths[1]),
                _trim(str(op.target_row_count), col_widths[2]),
                _trim(op.status, col_widths[3]),
                _trim(op.description, col_widths[4]),
            ]
            lines.append(" | ".join(row))
        
        lines.append("-" * table_width)
        lines.append("")
        
        # Summary statistics
        total_source = sum(op.source_row_count for op in self.operations 
                          if op.status != "skipped")
        total_target = sum(op.target_row_count for op in self.operations 
                          if op.status != "skipped")
        
        lines.append("SUMMARY")
        lines.append("-" * table_width)
        lines.append(f"Total Operations:      {len(self.operations)}")
        lines.append(f"Would-Execute:         {len([op for op in self.operations if op.status == 'would_execute'])}")
        lines.append(f"Skipped:               {len([op for op in self.operations if op.status == 'skipped'])}")
        lines.append(f"Total Source Rows:     {total_source:,}")
        lines.append(f"Total Target Rows:     {total_target:,}")
        lines.append("")
        
        # Warnings
        if self.warnings:
            lines.append("WARNINGS")
            lines.append("-" * table_width)
            for warning in self.warnings:
                lines.append(f"  WARN: {warning}")
            lines.append("")
        
        # Errors
        if self.errors:
            lines.append("ERRORS")
            lines.append("-" * table_width)
            for error in self.errors:
                lines.append(f"  ERROR: {error}")
            lines.append("")
        
        lines.append("=" * table_width)
        lines.append("")
        
        return "\n".join(lines)
    
    def to_json(self) -> str:
        """Generate JSON representation."""
        data = {
            "script_name": self.script_name,
            "timestamp": self.timestamp,
            "database_url": _redact_database_url(self.database_url),
            "statistics": {
                "total_operations": len(self.operations),
                "would_execute": len([op for op in self.operations if op.status == "would_execute"]),
                "skipped": len([op for op in self.operations if op.status == "skipped"]),
                "total_source_rows": sum(op.source_row_count for op in self.operations),
                "total_target_rows": sum(op.target_row_count for op in self.operations),
            },
            "operations": [op.to_dict() for op in self.operations],
            "warnings": self.warnings,
            "errors": self.errors,
        }
        return json.dumps(data, indent=2)
    
    def to_markdown(self) -> str:
        """Generate markdown representation."""
        lines = []
        lines.append(f"# Dry-Run Migration Report: {self.script_name}")
        lines.append(f"Generated: {self.timestamp}")
        lines.append("")
        
        # Summary
        lines.append("## Summary")
        lines.append("")
        total_ops = len(self.operations)
        would_exec = len([op for op in self.operations if op.status == "would_execute"])
        skipped = len([op for op in self.operations if op.status == "skipped"])
        total_rows = sum(op.source_row_count for op in self.operations)
        
        lines.append(f"- **Total Operations**: {total_ops}")
        lines.append(f"- **Would Execute**: {would_exec}")
        lines.append(f"- **Skipped**: {skipped}")
        lines.append(f"- **Total Rows to Migrate**: {total_rows:,}")
        lines.append("")
        
        # Operations
        lines.append("## Operations")
        lines.append("")
        lines.append("| Source | Target | Source Count | Status | Description |")
        lines.append("|--------|--------|--------------|--------|-------------|")
        
        for op in self.operations:
            if op.operation_type == OperationType.TABLE_MIGRATE:
                source = op.source_table or ""
                target = op.target_table or ""
            elif op.operation_type == OperationType.TABLE_DROP:
                source = f"DROP: {op.source_table or ''}"
                target = ""
            else:
                source = op.description
                target = ""
            
            lines.append(
                f"| {source} | {target} | {op.source_row_count} | {op.status} | {op.description} |"
            )
        
        lines.append("")
        
        # Warnings
        if self.warnings:
            lines.append("## Warnings")
            lines.append("")
            for warning in self.warnings:
                lines.append(f"- ⚠️  {warning}")
            lines.append("")
        
        # Errors
        if self.errors:
            lines.append("## Errors")
            lines.append("")
            for error in self.errors:
                lines.append(f"- ❌ {error}")
            lines.append("")
        
        return "\n".join(lines)
    
    def print_ascii(self) -> None:
        """Print ASCII table to stdout."""
        print(self.to_ascii_table())
    
    def save_report(self, output_path: str, format: str = "ascii") -> None:
        """Save report to file.
        
        Args:
            output_path: Path to save report to
            format: Output format - 'ascii', 'json', or 'markdown'
        """
        if format == "json":
            content = self.to_json()
        elif format == "markdown":
            content = self.to_markdown()
        else:
            content = self.to_ascii_table()
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Report saved to: {output_path}")


def create_migration_operation(
    operation_type: OperationType,
    source_table: Optional[str] = None,
    target_table: Optional[str] = None,
    source_row_count: int = 0,
    target_row_count: int = 0,
    description: str = "",
    status: str = "pending",
) -> MigrationOperation:
    """Factory function to create migration operations."""
    return MigrationOperation(
        operation_type=operation_type,
        source_table=source_table,
        target_table=target_table,
        source_row_count=source_row_count,
        target_row_count=target_row_count,
        description=description,
        status=status,
    )
