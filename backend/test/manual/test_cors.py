"""Manual CORS integration test - requires running backend server."""

import pytest
import requests

BASE_URL = "http://localhost:3000"


@pytest.mark.manual
@pytest.mark.integration
def test_cors_headers():
    """Test CORS headers are returned correctly from the running backend."""
    # This test requires the backend to be running
    try:
        response = requests.options(f"{BASE_URL}/api/")
        response.raise_for_status()
        
        assert "access-control-allow-origin" in response.headers or \
               "Access-Control-Allow-Origin" in response.headers, \
               "CORS headers not found in response"
        
        print(f"✅ CORS headers verified: {dict(response.headers)}")
    except requests.exceptions.ConnectionError:
        pytest.skip("Backend server not running at http://localhost:3000")
