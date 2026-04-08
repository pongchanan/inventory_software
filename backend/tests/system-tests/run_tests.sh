#!/usr/bin/env bash
# Run all Robot Framework system tests against the local backend.
# Usage: ./run_tests.sh [optional robot args]
#
# Override defaults:
#   ./run_tests.sh -v BASE_URL:http://localhost:3000
#   ./run_tests.sh -v ADMIN_EMAIL:other@mail.com -v ADMIN_PASSWORD:secret

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

pip install -q -r "$SCRIPT_DIR/requirements-robot.txt"

robot \
    --outputdir "$SCRIPT_DIR/results" \
    --variable BASE_URL:http://localhost:3000 \
    --variable ADMIN_EMAIL:testadmin@gmail.com \
    --variable ADMIN_PASSWORD:admin123 \
    "$@" \
    "$SCRIPT_DIR/suites"
