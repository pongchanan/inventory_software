"""Manual end-to-end flow test for kiosk registration - requires running backend server and frontend."""

import pytest
import requests
import time
import random

BASE_URL = "http://localhost:3000"
KIOSK_ID = "kiosk_demo_01"


@pytest.mark.manual
@pytest.mark.integration
def test_kiosk_full_registration_flow():
    """
    Manual test simulating the complete kiosk registration flow:
    1. Student fills form on mobile
    2. Student waits at kiosk
    3. Student taps RFID card
    4. System completes registration
    
    REQUIRES: Backend running at http://localhost:3000
    """
    print("\n--- 📱 Mobile Web: Student fills out form ---")
    student_data = {
        "kiosk_id": KIOSK_ID,
        "name": f"Test Student {random.randint(100, 999)}",
        "email": f"test_{random.randint(1000, 9999)}@example.com",
        "password": "securepassword123"
    }
    
    print(f"Sending data to {BASE_URL}/api/auth/kiosk/prepare_registration...")
    try:
        res = requests.post(f"{BASE_URL}/api/auth/kiosk/prepare_registration", json=student_data)
        print("Response:", res.json())
        res.raise_for_status()
    except requests.exceptions.ConnectionError as e:
        pytest.skip("Backend server not running at http://localhost:3000")
    except requests.exceptions.HTTPError as e:
        pytest.fail(f"HTTP error: {e}")

    print("\n--- ⏳ Mobile Web: Polling for status (Simulating waiting at Kiosk) ---")
    for i in range(3):
        res = requests.get(f"{BASE_URL}/api/auth/kiosk/status/{KIOSK_ID}")
        print(f"Poll {i+1}:", res.json())
        time.sleep(1)
        
    print("\n--- 💳 Kiosk Hardware: Student taps card ---")
    card_uid = f"UID-{random.randint(10000, 99999)}"
    print(f"Scanning card with UID: {card_uid}...")
    scan_data = {
        "kiosk_id": KIOSK_ID,
        "uid": card_uid
    }
    res = requests.post(f"{BASE_URL}/api/auth/kiosk/scan", json=scan_data)
    print("Kiosk Response:", res.json())

    print("\n--- 🎉 Mobile Web: Final Poll ---")
    res = requests.get(f"{BASE_URL}/api/auth/kiosk/status/{KIOSK_ID}")
    final_status = res.json()
    print("Final Status:", final_status)
    if final_status.get("status") == "success":
        print("\n✅ Success! User was created and JWT Token was received.")
        print(f"Token: {final_status['access_token'][:20]}...")
        assert final_status["status"] == "success"
    else:
        pytest.fail("❌ Something went wrong in the flow.")
