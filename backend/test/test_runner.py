#!/usr/bin/env python3
"""Test runner helper - Simplifies running different test suites.

Usage:
    python test_runner.py auto      # Run automated tests
    python test_runner.py unit      # Run unit tests only
    python test_runner.py contract  # Run contract tests only
    python test_runner.py manual    # Run manual tests (requires backend running)
    python test_runner.py all       # Run all tests
    python test_runner.py coverage  # Run with coverage
    python test_runner.py --help    # Show help
"""

import subprocess
import sys
from pathlib import Path

# Map command names to pytest arguments
COMMANDS = {
    "auto": {
        "args": ["--ignore=test/manual"],
        "description": "Run automated tests (fast, deterministic) - excludes manual tests"
    },
    "unit": {
        "args": ["-m", "unit", "--ignore=test/manual"],
        "description": "Run unit tests only (single component, no external deps)"
    },
    "contract": {
        "args": ["-m", "contract", "--ignore=test/manual"],
        "description": "Run contract tests only (API validation)"
    },
    "integration": {
        "args": ["-m", "integration", "--ignore=test/manual"],
        "description": "Run integration tests (cross-component within backend)"
    },
    "manual": {
        "args": ["test/manual", "-m", "manual", "-v"],
        "description": "Run manual tests (requires backend at http://localhost:3000)"
    },
    "fast": {
        "args": ["-m", "unit or contract", "--ignore=test/manual", "-x"],
        "description": "Fast TDD loop (unit+contract, stop on first failure)"
    },
    "all": {
        "args": ["-v"],
        "description": "Run all tests including manual (requires backend + frontend)"
    },
    "coverage": {
        "args": ["--cov=app", "--cov-report=html", "--cov-report=term-missing", "--ignore=test/manual"],
        "description": "Run tests with coverage report (automated only)"
    },
    "coverage-all": {
        "args": ["--cov=app", "--cov-report=html", "--cov-report=term-missing"],
        "description": "Run all tests with coverage (requires backend + frontend)"
    }
}


def print_help():
    """Print usage information."""
    print(__doc__)
    print("\nAvailable commands:\n")
    for cmd, config in COMMANDS.items():
        print(f"  {cmd:<15} - {config['description']}")
    print()


def run_command(command: str):
    """Run pytest with the specified command configuration."""
    if command not in COMMANDS:
        print(f"❌ Unknown command: {command}")
        print_help()
        return 1
    
    config = COMMANDS[command]
    print(f"\n▶ Running: {config['description']}")
    print(f"  pytest {' '.join(config['args'])}\n")
    
    # Run pytest
    result = subprocess.run(
        ["pytest"] + config["args"],
        cwd=Path(__file__).parent
    )
    
    return result.returncode


def main():
    """Entry point."""
    if len(sys.argv) < 2 or sys.argv[1] in ["-h", "--help", "help"]:
        print_help()
        return 0
    
    command = sys.argv[1]
    return run_command(command)


if __name__ == "__main__":
    sys.exit(main())
