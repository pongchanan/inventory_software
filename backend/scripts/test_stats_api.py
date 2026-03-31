#!/usr/bin/env python
"""
Test script for the new statistics API endpoints.
Run this after the backend is started with: python test_stats_api.py
"""

import requests
import json
from urllib.parse import urljoin

# Configuration
BASE_URL = "http://localhost:3000"
ENDPOINTS = {
    "most_borrowed": "/api/stats/most-borrowed",
    "most_damaged": "/api/stats/most-damaged",
}

def test_endpoint(name, endpoint, params=None):
    """Test a single endpoint"""
    url = urljoin(BASE_URL, endpoint)
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, params=params)
        print(f"Status: {response.status_code}")
        
        if response.ok:
            data = response.json()
            print(f"Response:")
            print(json.dumps(data, indent=2))
            
            if isinstance(data, list):
                print(f"\n✓ Returned {len(data)} items")
                if data:
                    print("Sample item:")
                    print(f"  - Name: {data[0].get('name')}")
                    print(f"  - Value: {data[0].get('value')}")
                    print(f"  - Color: {data[0].get('color', 'N/A')}")
        else:
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"✗ Could not connect to {BASE_URL}")
        print("Make sure the backend is running: python -m app.main")
    except Exception as e:
        print(f"✗ Error: {e}")

def main():
    print("Smart Inventory API - Statistics Endpoints Test")
    print("="*60)
    
    test_endpoint("Most Borrowed Items", ENDPOINTS["most_borrowed"], {"limit": 5})
    test_endpoint("Most Borrowed Items (Last 7 days)", ENDPOINTS["most_borrowed"], {"limit": 5, "hours": 168})
    test_endpoint("Most Damaged Items", ENDPOINTS["most_damaged"], {"limit": 5})
    
    print(f"\n{'='*60}")
    print("Test complete!")

if __name__ == "__main__":
    main()
