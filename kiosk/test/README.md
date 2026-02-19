# Kiosk Testing Guide

This directory contains testing documentation and test files for the Arduino ESP32 kiosk system.

## Overview

The kiosk system is built on ESP32 and includes:
- **PN532 NFC Reader** (I2C) - User authentication
- **MFRC522 RFID Reader** (SPI) - Item scanning
- **Solenoid Lock** - Cabinet access control
- **Touch Sensor/Switch** - Door state detection
- **WiFi** - Backend API communication

## Testing Approaches

### 1. Unit Testing with AUnit

AUnit is a unit testing framework for Arduino. Install it via Arduino Library Manager.

#### Installation:
1. Open Arduino IDE
2. Go to Sketch → Include Library → Manage Libraries
3. Search for "AUnit" and install

### 2. Hardware-in-the-Loop (HIL) Testing

Test with actual hardware using serial monitor output validation.

### 3. Simulation Testing

Use Wokwi or similar simulators for component-level testing without physical hardware.

## Test Structure

### Unit Tests (`test_state_machine.ino`)
Tests individual state machine functions with mocked hardware.

### Integration Tests (`test_integration.ino`)
Tests the full system with actual hardware or simulators.

### Manual Tests (`manual_test_checklist.md`)
Step-by-step hardware verification procedures.

## Running Tests

### Using AUnit Framework:

1. **Setup the test sketch:**
```cpp
#include <AUnit.h>

test(state_transitions) {
  // Test code here
  assertEqual(IDLE, currentState);
}

void setup() {
  Serial.begin(115200);
  // Initialize test environment
}

void loop() {
  aunit::TestRunner::run();
}
```

2. **Upload and monitor:**
```bash
# Compile and upload
arduino-cli compile --fqbn esp32:esp32:esp32 kiosk_main
arduino-cli upload -p COM3 --fqbn esp32:esp32:esp32 kiosk_main

# Monitor output
arduino-cli monitor -p COM3
```

### Manual Hardware Testing:

1. Connect ESP32 to computer via USB
2. Open Serial Monitor (115200 baud)
3. Follow manual test checklist
4. Verify expected outputs

## Test Categories

### 1. State Machine Tests
- Verify state transitions (IDLE → VERIFYING_USER → CABINET_UNLOCKED, etc.)
- Test state timeouts and edge cases
- Validate error handling

### 2. NFC/RFID Tests
- User card detection (PN532)
- Item card scanning (MFRC522)
- UID parsing and formatting
- Duplicate item detection

### 3. Hardware Interface Tests
- Lock control (HIGH/LOW signals)
- Door sensor reading (INPUT_PULLUP validation)
- WiFi connectivity
- HTTP API communication

### 4. Integration Tests
- Complete user flow: scan card → open door → scan item → close door
- Multiple item scanning in single session
- Network failure scenarios
- Offline mode operation

## Example Test Cases

### Test 1: User Card Detection
```cpp
test(user_card_detected) {
  // Simulate card present
  mockCardPresent = true;
  mockUID = "04A1B2C3";
  
  checkUserScan();
  
  assertEqual(VERIFYING_USER, currentState);
  assertEqual("04A1B2C3", currentUserId);
}
```

### Test 2: Authorization Check
```cpp
test(authorization_success) {
  String uid = "04A1B2C3";
  mockHttpResponse(200); // Mock API success
  
  bool authorized = checkUserAuthorization(uid);
  
  assertTrue(authorized);
}

test(authorization_failure) {
  String uid = "INVALID";
  mockHttpResponse(404); // Mock API failure
  
  bool authorized = checkUserAuthorization(uid);
  
  assertFalse(authorized);
}
```

### Test 3: Door State Detection
```cpp
test(door_closes_triggers_reporting) {
  currentState = WAITING_FOR_ACTION;
  mockDigitalRead(TOUCH_PIN, LOW); // Door closed
  
  checkCabinetClose();
  
  assertEqual(REPORTING, currentState);
}
```

### Test 4: Item Scanning
```cpp
test(item_added_to_list) {
  scannedItems.clear();
  mockMFRC522CardPresent = true;
  mockMFRC522UID = "E1F2G3H4";
  
  checkItemScan();
  
  assertEqual(1, scannedItems.size());
  assertEqual("E1F2G3H4", scannedItems[0]);
}

test(duplicate_item_rejected) {
  scannedItems.clear();
  scannedItems.push_back("E1F2G3H4");
  mockMFRC522UID = "E1F2G3H4";
  
  checkItemScan();
  
  assertEqual(1, scannedItems.size()); // Still only 1 item
}
```

## Mocking Hardware

For unit tests without hardware, create mock functions:

```cpp
// Mock variables
bool mockCardPresent = false;
String mockUID = "";
int mockPinStates[40] = {0}; // Mock all GPIO pins

// Mock digitalWrite
#define digitalWrite(pin, state) mock_digitalWrite(pin, state)
void mock_digitalWrite(int pin, int state) {
  mockPinStates[pin] = state;
}

// Mock digitalRead
#define digitalRead(pin) mock_digitalRead(pin)
int mock_digitalRead(int pin) {
  return mockPinStates[pin];
}

// Mock HTTP responses
class MockHTTPClient {
  int mockResponseCode = 200;
public:
  void begin(String url) {}
  int GET() { return mockResponseCode; }
  int POST(String data) { return mockResponseCode; }
  void end() {}
  void setMockResponse(int code) { mockResponseCode = code; }
};
```

## Continuous Integration

### PlatformIO Testing (Recommended for CI/CD)

1. **Convert to PlatformIO project:**
```bash
pio init --board esp32dev
```

2. **Add test configuration to `platformio.ini`:**
```ini
[env:test]
platform = espressif32
board = esp32dev
framework = arduino
test_framework = unity
lib_deps = 
    bblanchon/ArduinoJson
    adafruit/Adafruit PN532
    miguelbalboa/MFRC522
```

3. **Run tests:**
```bash
pio test -e test
```

### GitHub Actions Example

```yaml
name: Kiosk Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up PlatformIO
        uses: platformio/platformio-action@v1
        
      - name: Run tests
        run: |
          cd kiosk
          pio test -e test
```

## Best Practices

1. **Isolate Components**: Test each function independently with mocks
2. **Test Edge Cases**: Empty UIDs, network failures, timeout scenarios
3. **Validate State Transitions**: Ensure state machine follows expected flow
4. **Serial Output Assertions**: Verify correct debug messages
5. **Hardware Simulation**: Use realistic timing delays in tests
6. **Document Expected Behavior**: Comment what each test validates

## Troubleshooting

### Common Issues:

**Problem: Tests hang during upload**
- Solution: Hold BOOT button on ESP32 during upload

**Problem: Serial output garbled**
- Solution: Verify baud rate is 115200

**Problem: NFC reader not detected in tests**
- Solution: Check I2C connections and power supply

**Problem: State machine stuck in loop**
- Solution: Add timeout mechanisms and verify state transition conditions

## Performance Testing

Monitor these metrics during testing:
- Loop execution time (should be < 100ms)
- Memory usage (ESP32 has ~320KB RAM)
- WiFi connection reliability
- HTTP request response times
- NFC read success rate

Use these Serial.print statements:
```cpp
unsigned long loopStart = millis();
// ... loop code ...
Serial.printf("Loop time: %lu ms\n", millis() - loopStart);

Serial.printf("Free heap: %d bytes\n", ESP.getFreeHeap());
```

## Safety Considerations

When testing:
- **Never test with live mains voltage on lock**
- Use low-voltage solenoid (12V DC max)
- Include emergency manual override
- Test fail-safe lock state (defaults to LOCKED)
- Verify timeout mechanisms prevent indefinite unlock

## Further Resources

- [AUnit Documentation](https://github.com/bxparks/AUnit)
- [Arduino Unit Testing Guide](https://docs.platformio.org/en/latest/advanced/unit-testing/index.html)
- [ESP32 Testing Best Practices](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/contribute/esp-idf-tests-with-pytest.html)
- [Wokwi Simulator](https://wokwi.com/) - Online ESP32 simulator
