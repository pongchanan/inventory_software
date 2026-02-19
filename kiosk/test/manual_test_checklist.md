# Manual Test Checklist for Kiosk Hardware

## Pre-Test Setup

- [ ] ESP32 powered via USB or external 5V supply
- [ ] PN532 NFC reader connected to I2C (SDA=21, SCL=22)
- [ ] MFRC522 RFID reader connected to SPI (SS=5, RST=27)
- [ ] Solenoid lock connected to Pin 26 through relay/transistor
- [ ] Touch sensor/switch connected to Pin 4 with INPUT_PULLUP
- [ ] WiFi credentials configured in code
- [ ] Backend API server running and accessible
- [ ] Serial Monitor open at 115200 baud

## System Initialization Tests

### Test 1: Power-On and Boot Sequence
**Expected Result:** System boots, WiFi connects, sensors initialize

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Power on ESP32 | Serial output starts | ☐ |
| 2 | Wait for boot | "System Ready" message appears | ☐ |
| 3 | Check WiFi | IP address displayed | ☐ |
| 4 | Check PN532 | "Found PN532" message shown | ☐ |
| 5 | Check MFRC522 | "MFRC522 Initialized" shown | ☐ |
| 6 | Check door state | Initial door state displayed | ☐ |

**Notes:**
_______________________________________________________________________

### Test 2: Initial State Verification
**Expected Result:** System in IDLE state, lock is LOCKED

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Check lock pin | LED/relay OFF (locked) | ☐ |
| 2 | Check state | "Waiting for User" message | ☐ |
| 3 | Touch door sensor | State remains IDLE | ☐ |

**Notes:**
_______________________________________________________________________

## User Authentication Tests

### Test 3: Valid User Card Scan
**Expected Result:** User authenticated, cabinet unlocked

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Present valid NFC card to PN532 | "User Card Detected!" | ☐ |
| 2 | Wait for API check | UID displayed in serial | ☐ |
| 3 | Check authorization | "Access Granted" message | ☐ |
| 4 | Verify unlock | Lock pin goes HIGH | ☐ |
| 5 | Check state | "Waiting for Door to OPEN" | ☐ |

**UID Detected:** _______________________
**Response Time:** ____________ ms

**Notes:**
_______________________________________________________________________

### Test 4: Invalid User Card Scan
**Expected Result:** Access denied, lock remains locked

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Present unknown NFC card | "User Card Detected!" | ☐ |
| 2 | Wait for API check | UID displayed in serial | ☐ |
| 3 | Check authorization | "Access Denied" message | ☐ |
| 4 | Verify lock state | Lock remains LOW (locked) | ☐ |
| 5 | Check state | Returns to IDLE | ☐ |

**Notes:**
_______________________________________________________________________

### Test 5: Offline Mode Operation
**Expected Result:** System allows access in offline mode

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Disconnect WiFi | WiFi status failed | ☐ |
| 2 | Present any NFC card | Card detected | ☐ |
| 3 | Check authorization | "Offline Mode: Mock Authorization" | ☐ |
| 4 | Verify access | Access granted | ☐ |

**Notes:**
_______________________________________________________________________

## Door Operation Tests

### Test 6: Door Open Detection
**Expected Result:** System detects door opening

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Authenticate user | Cabinet unlocked | ☐ |
| 2 | Keep door closed (sensor touched) | "Still Closed/Touched" messages | ☐ |
| 3 | Open door (release sensor) | "Door Opened (State: HIGH/OPEN)" | ☐ |
| 4 | Check state | State changes to WAITING_FOR_ACTION | ☐ |

**Notes:**
_______________________________________________________________________

### Test 7: Door Close Detection
**Expected Result:** Closing door triggers reporting

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Complete authentication flow | Door open, in WAITING_FOR_ACTION | ☐ |
| 2 | Scan 1-2 items | Items added to list | ☐ |
| 3 | Close door (touch sensor) | "Door Closed Detected" message | ☐ |
| 4 | Check state | Changes to REPORTING | ☐ |
| 5 | Verify lock | Lock engages (LOW) | ☐ |

**Notes:**
_______________________________________________________________________

## Item Scanning Tests

### Test 8: Single Item Scan
**Expected Result:** Item detected and added to session

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Authenticate and open door | In WAITING_FOR_ACTION state | ☐ |
| 2 | Present RFID item tag to MFRC522 | "Item Added" message | ☐ |
| 3 | Check serial output | UID displayed correctly | ☐ |
| 4 | Verify count | "Total Items: 1" | ☐ |

**Item UID:** _______________________

**Notes:**
_______________________________________________________________________

### Test 9: Multiple Items Scan
**Expected Result:** All items recorded correctly

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Authenticate and open door | System ready | ☐ |
| 2 | Scan item 1 | "Total Items: 1" | ☐ |
| 3 | Scan item 2 | "Total Items: 2" | ☐ |
| 4 | Scan item 3 | "Total Items: 3" | ☐ |
| 5 | Verify all UIDs | All UIDs listed correctly | ☐ |

**Item UIDs:** 
1. _______________________
2. _______________________
3. _______________________

**Notes:**
_______________________________________________________________________

### Test 10: Duplicate Item Rejection
**Expected Result:** Duplicate items not added

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Authenticate and open door | System ready | ☐ |
| 2 | Scan item | "Item Added", Total: 1 | ☐ |
| 3 | Scan same item again | "Item already scanned" message | ☐ |
| 4 | Verify count | "Total Items: 1" (unchanged) | ☐ |

**Notes:**
_______________________________________________________________________

## Transaction Reporting Tests

### Test 11: Successful Transaction Report
**Expected Result:** Data sent to backend API

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Complete full flow (auth + scan) | Multiple items scanned | ☐ |
| 2 | Close door | Enters REPORTING state | ☐ |
| 3 | Check serial output | "Reporting Transaction" for each item | ☐ |
| 4 | Verify API calls | "Server Response: 200" or similar | ☐ |
| 5 | Check session reset | Returns to IDLE, items cleared | ☐ |

**Number of items reported:** _______
**All API calls successful:** ☐ Yes ☐ No

**Notes:**
_______________________________________________________________________

### Test 12: Empty Transaction (No Items)
**Expected Result:** Transaction reported even without items

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Authenticate and open door | Access granted | ☐ |
| 2 | Don't scan any items | Items list empty | ☐ |
| 3 | Close door | Enters REPORTING | ☐ |
| 4 | Check report | "No items scanned" message | ☐ |
| 5 | Verify reset | Returns to IDLE correctly | ☐ |

**Notes:**
_______________________________________________________________________

## Edge Cases and Error Handling

### Test 13: Network Failure During Transaction
**Expected Result:** System handles network errors gracefully

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Start transaction | User authenticated | ☐ |
| 2 | Disconnect network | WiFi disconnects | ☐ |
| 3 | Scan items | Items still recorded locally | ☐ |
| 4 | Close door | Attempts to report | ☐ |
| 5 | Check error handling | Error message shown, doesn't crash | ☐ |

**Notes:**
_______________________________________________________________________

### Test 14: NFC Reader Failure
**Expected Result:** System reports error but continues

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Disconnect PN532 | Boot shows "PN532 not found" | ☐ |
| 2 | System continues | No crash or hang | ☐ |
| 3 | MFRC522 still works | Can scan with MFRC522 | ☐ |

**Notes:**
_______________________________________________________________________

### Test 15: Power Cycle During Operation
**Expected Result:** Safe state recovery

| Step | Action | Expected Output | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Start transaction | Door unlocked, items scanned | ☐ |
| 2 | Power off ESP32 | System shuts down | ☐ |
| 3 | Power on ESP32 | Clean boot | ☐ |
| 4 | Check lock state | Lock defaults to LOCKED | ☐ |
| 5 | Check system state | Returns to IDLE | ☐ |

**Notes:**
_______________________________________________________________________

## Performance Tests

### Test 16: Response Time Measurement

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| Card detection time | < 500ms | ______ ms | ☐ |
| API authorization time | < 2s | ______ ms | ☐ |
| Item scan detection | < 300ms | ______ ms | ☐ |
| Lock actuation time | < 100ms | ______ ms | ☐ |
| Complete loop cycle | < 100ms | ______ ms | ☐ |

**Notes:**
_______________________________________________________________________

### Test 17: Memory and Stability

| Test | Duration | Result | Pass/Fail |
|------|----------|--------|-----------|
| Continuous operation | 1 hour | No crashes | ☐ |
| Multiple transactions | 20+ cycles | All successful | ☐ |
| Memory leaks | Check free heap | No degradation | ☐ |

**Initial Free Heap:** ____________ bytes
**Final Free Heap:** ____________ bytes

**Notes:**
_______________________________________________________________________

## Sign-Off

**Tester Name:** _____________________________
**Date:** _____________________________
**Overall Result:** ☐ Pass ☐ Fail (with issues)

**Critical Issues Found:**
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________

**Recommendations:**
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
