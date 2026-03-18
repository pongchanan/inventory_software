"""Configuration for manual tests.

Manual tests require external services/hardware and are generally excluded
from automated CI/CD pipelines. Run manually with: pytest test/manual
"""

import pytest


def pytest_configure(config):
    """Register custom marker for manual tests."""
    config.addinivalue_line(
        "markers", "manual: marks tests that require external services/hardware"
    )
