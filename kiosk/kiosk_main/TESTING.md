# Hardware Testing Guide

Test each component separately before running the full kiosk system.

## 📋 Test Files Overview

| File | Tests | Use When |
|------|-------|----------|
| `test_nfc_pn532.ino` | PN532 NFC reader only | First time setup, troubleshooting user card reader |
| `test_rfid_mfrc522.ino` | MFRC522 RFID reader only | First time setup, troubleshooting item scanner |
| `kiosk_main.ino` | Full kiosk system | After individual tests pass |

## 🧪 Testing Workflow

### Step 1: Test PN532 NFC Reader

1. **Wire ONLY the PN532:**
   - PN532 SDA → GPIO 21
   - PN532 SCL → GPIO 22
   - PN532 VCC → 3.3V or 5V
   - PN532 GND → GND

2. **Upload test sketch:**
   - Open `test_nfc_pn532.ino` in Arduino IDE
   - Upload to ESP32

3. **Open Serial Monitor:**
   - Set baud rate to **115200**
   - Should see: "✓ PN532 Found!"

4. **Test card scanning:**
   - Place NFC card near PN532
   - Should see card UID displayed
   - Try multiple cards

5. **Verify:**
   - [ ] PN532 detected successfully
   - [ ] Firmware version displayed
   - [ ] Cards are read consistently
   - [ ] UID displayed in HEX and string format

**If it fails:** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#-nfcrfid-reader-issues)

---

### Step 2: Test MFRC522 RFID Reader

1. **Wire ONLY the MFRC522:**
   - MFRC522 RST → GPIO 27
   - MFRC522 SDA (SS) → GPIO 5
   - MFRC522 MOSI → GPIO 23
   - MFRC522 MISO → GPIO 19
   - MFRC522 SCK → GPIO 18
   - MFRC522 VCC → 3.3V ⚠️ **ONLY**
   - MFRC522 GND → GND

2. **Upload test sketch:**
   - Open `test_rfid_mfrc522.ino` in Arduino IDE
   - Upload to ESP32

3. **Open Serial Monitor:**
   - Set baud rate to **115200**
   - Should see: "✓ MFRC522 Found!"

4. **Test tag scanning:**
   - Place RFID tag near MFRC522
   - Should see tag UID displayed
   - Try multiple tags

5. **Verify:**
   - [ ] MFRC522 detected successfully
   - [ ] Firmware version displayed
   - [ ] Tags are read consistently
   - [ ] UID and card type displayed

**If it fails:** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#-nfcrfid-reader-issues)

---

### Step 3: Test Door Sensor

1. **Wire door sensor:**
   - Sensor → GPIO 4
   - GND → GND

2. **Upload simple test:**
   ```cpp
   void setup() {
     Serial.begin(115200);
     pinMode(4, INPUT_PULLUP);
   }
   
   void loop() {
     int state = digitalRead(4);
     Serial.printf("Door: %s\n", state == LOW ? "CLOSED" : "OPEN");
     delay(500);
   }
   ```

3. **Test:**
   - Disconnected = "OPEN"
   - Connect GPIO 4 to GND = "CLOSED"

4. **Verify:**
   - [ ] Reads "OPEN" when disconnected
   - [ ] Reads "CLOSED" when connected to GND
   - [ ] Switches reliably

---

### Step 4: Test Solenoid Lock

1. **Wire relay and solenoid:**
   - ESP32 GPIO 26 → Relay IN
   - ESP32 GND → Relay GND
   - ESP32 5V → Relay VCC
   - 12V+ → Relay COM
   - Relay NO → Solenoid +
   - Solenoid - → 12V-

2. **Upload test:**
   ```cpp
   void setup() {
     Serial.begin(115200);
     pinMode(26, OUTPUT);
   }
   
   void loop() {
     Serial.println("Unlock");
     digitalWrite(26, HIGH);
     delay(3000);
     
     Serial.println("Lock");
     digitalWrite(26, LOW);
     delay(3000);
   }
   ```

3. **Test:**
   - Should hear relay click every 3 seconds
   - Solenoid should activate/deactivate

4. **Verify:**
   - [ ] Relay clicks audibly
   - [ ] Solenoid moves/activates
   - [ ] No overheating
   - [ ] Voltages correct with multimeter

---

### Step 5: Test WiFi Connection

1. **Upload WiFi test:**
   ```cpp
   #include <WiFi.h>
   
   const char* ssid = "YourSSID";
   const char* password = "YourPassword";
   
   void setup() {
     Serial.begin(115200);
     WiFi.begin(ssid, password);
     
     while (WiFi.status() != WL_CONNECTED) {
       delay(500);
       Serial.print(".");
     }
     
     Serial.println("\nConnected!");
     Serial.print("IP: ");
     Serial.println(WiFi.localIP());
     Serial.print("Signal: ");
     Serial.print(WiFi.RSSI());
     Serial.println(" dBm");
   }
   
   void loop() {}
   ```

2. **Verify:**
   - [ ] Connects to WiFi
   - [ ] IP address assigned
   - [ ] Signal strength good (-30 to -70 dBm)

---

### Step 6: Test Full System

1. **Wire ALL components** per [HARDWARE_WIRING.md](HARDWARE_WIRING.md)

2. **Upload `kiosk_main.ino`**

3. **Verify initialization:**
   ```
   ✓ WiFi Connected
   ✓ MQTT Connected
   ✓ PN532 Ready
   ✓ MFRC522 Ready
   System Ready!
   ```

4. **Test complete workflow:**
   - [ ] User card scan (PN532)
   - [ ] MQTT authorization
   - [ ] Cabinet unlocks
   - [ ] Door opens
   - [ ] Item scanning (MFRC522)
   - [ ] Door closes
   - [ ] Transactions published
   - [ ] Cabinet locks

---

## 📊 Expected Serial Outputs

### PN532 Test Output
```
========================================
PN532 NFC Reader Test
========================================

✓ PN532 Found!
Firmware Version: 0x32

========================================
Ready! Place an NFC card near the reader
========================================

*** NFC Card Detected! ***
UID (HEX): 04 a1 b2 c3
UID (String): 04A1B2C3
UID Length: 4 bytes

Waiting for card removal...
Ready for next card!
```

### MFRC522 Test Output
```
========================================
MFRC522 RFID Reader Test
========================================

✓ MFRC522 Found!
Firmware Version: 0x92

========================================
Ready! Place an RFID tag near the reader
========================================

*** RFID Tag Detected! ***
UID (HEX): 5a 6b 7c 8d
UID (String): 5A6B7C8D
UID Length: 4 bytes
Card Type: MIFARE 1KB

Ready for next tag!
```

---

## ⚠️ Common Issues

### PN532 Not Detected

**Check:**
- I2C wiring (SDA=21, SCL=22)
- DIP switches set to I2C mode
- Power supply (3.3V or 5V)
- Try swapping SDA/SCL

### MFRC522 Not Detected

**Check:**
- SPI wiring (all 5 data pins)
- Power is 3.3V (NOT 5V!)
- RST pin connected properly
- Solder joints

### Cards Not Reading

**Check:**
- Distance (within 2-5cm)
- Card compatibility (MIFARE, NTAG)
- Power supply stable
- Antenna connection

---

## 🔍 Debug Tools

### I2C Scanner (Find PN532 Address)

```cpp
#include <Wire.h>

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  Serial.println("I2C Scanner");
}

void loop() {
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("Device at 0x%02X\n", addr);
    }
  }
  delay(5000);
}
```
PN532 should appear at **0x24**.

### Voltage Check

Use multimeter to verify:
- ESP32 3.3V pin: 3.2-3.4V
- ESP32 5V pin: 4.8-5.2V
- PN532 VCC: Correct voltage
- MFRC522 VCC: 3.3V ONLY

---

**Next:** After all tests pass, proceed to [SETUP.md](SETUP.md) for full system configuration.
