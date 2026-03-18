#!/bin/bash

# Test runner helper - Simplifies running different test suites
#
# Usage:
#     ./test.sh auto      # Run automated tests
#     ./test.sh unit      # Run unit tests only
#     ./test.sh contract  # Run contract tests only
#     ./test.sh manual    # Run manual tests (requires backend running)
#     ./test.sh all       # Run all tests
#     ./test.sh coverage  # Run with coverage

set -e

show_help() {
    cat << 'EOF'
Test Runner Helper - Simplifies running different test suites

Usage:
  ./test.sh auto         - Run automated tests (default)
  ./test.sh unit         - Run unit tests only
  ./test.sh contract     - Run contract tests only  
  ./test.sh integration  - Run integration tests only
  ./test.sh manual       - Run manual tests (requires backend)
  ./test.sh fast         - Fast TDD loop (stop on first failure)
  ./test.sh all          - Run all tests
  ./test.sh coverage     - Run with coverage report
  ./test.sh coverage-all - Run all with coverage
  ./test.sh help         - Show this help

Examples:
  ./test.sh              - Same as "./test.sh auto"
  ./test.sh unit         - Only unit tests, fast feedback
  ./test.sh coverage     - Generate HTML coverage report
EOF
}

if [ $# -eq 0 ] || [ "$1" == "auto" ]; then
    echo ""
    echo "▶ Running automated tests (fast, deterministic - excludes manual)"
    echo ""
    pytest --ignore=test/manual
    exit 0
fi

case "$1" in
    unit)
        echo ""
        echo "▶ Running unit tests only (single component, no external deps)"
        echo ""
        pytest -m unit --ignore=test/manual
        ;;
    contract)
        echo ""
        echo "▶ Running contract tests only (API validation)"
        echo ""
        pytest -m contract --ignore=test/manual
        ;;
    integration)
        echo ""
        echo "▶ Running integration tests (cross-component)"
        echo ""
        pytest -m integration --ignore=test/manual
        ;;
    manual)
        echo ""
        echo "▶ Running manual tests (requires backend at http://localhost:3000)"
        echo ""
        pytest test/manual -m manual -v
        ;;
    fast)
        echo ""
        echo "▶ Fast TDD loop (unit+contract, stop on first failure)"
        echo ""
        pytest -m "unit or contract" --ignore=test/manual -x
        ;;
    all)
        echo ""
        echo "▶ Running all tests including manual (requires backend + frontend)"
        echo ""
        pytest -v
        ;;
    coverage)
        echo ""
        echo "▶ Running tests with coverage (automated only)"
        echo ""
        pytest --cov=app --cov-report=html --cov-report=term-missing --ignore=test/manual
        ;;
    coverage-all)
        echo ""
        echo "▶ Running all tests with coverage (requires backend + frontend)"
        echo ""
        pytest --cov=app --cov-report=html --cov-report=term-missing
        ;;
    help|-h|--help)
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
