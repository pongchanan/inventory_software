# Troubleshooting Guide

Common issues and solutions for the Smart Kiosk Controller.

## 🔍 Quick Diagnostic Steps

1. Open Serial Monitor (115200 baud)
2. Reset ESP32 (press button or power cycle)
3. Check initialization messages
4. Compare with expected output in [SETUP.md](SETUP.md)

---

## 📶 WiFi Issues

### ❌ Problem: "WiFi Failed (Offline Mode)"

**Symptoms:**
```
Connecting to WiFi: YourSSID
.............
WiFi Failed (Offline Mode).
```

**Solutions:**

✅ **Check SSID and Password**
```cpp
// In kiosk_config.h - case sensitive!
const char *ssid = "ExactNetworkName";
const char *password = "ExactPassword123";
```

✅ **Verify 2.4GHz Network**
- ESP32 only supports 2.4GHz WiFi
- Cannot connect to 5GHz networks
- Check router settings or use separate 2.4GHz SSID

✅ **Check Signal Strength**
```cpp
// Add to kiosk_main.ino after WiFi.begin()
if (WiFi.status() == WL_CONNECTED) {
  int rssi = WiFi.RSSI();
  Serial.printf("Signal strength: %d dBm\n", rssi);
}
```
- Good: -30 to -67 dBm
- Fair: -68 to -80 dBm
- Poor: -81 to -90 dBm
- Move closer to router if poor

✅ **Test with Phone Hotspot**
- Enable hotspot on your phone (2.4GHz)
- Update kiosk_config.h with hotspot credentials
- If connects successfully → router/network issue
- If still fails → ESP32 or code issue

✅ **Check Router MAC Filtering**
- Some routers block new devices
- Check router admin panel
- Add ESP32 MAC address to allowed list

✅ **Power Supply**
- Weak USB power can cause WiFi failures
- Use quality USB cable (not charge-only)
- Try different USB port or power adapter
- Recommended: 5V 2A power supply

---

### ❌ Problem: WiFi Disconnects Randomly

**Solutions:**

✅ **Enable Auto-Reconnect**
```cpp
// Add to setup() after WiFi.begin()
WiFi.setAutoReconnect(true);
WiFi.persistent(true);
```

✅ **Add Reconnection Logic**
```cpp
// Add to loop()
if (WiFi.status() != WL_CONNECTED) {
  Serial.println("WiFi lost! Reconnecting...");
  WiFi.reconnect();
}
```

✅ **Check Power Stability**
- USB power may be dropping voltage
- Try powered USB hub
- Use external 5V power supply

---

## 📡 MQTT Issues

### ❌ Problem: "MQTT connection failed. Will retry..."

**Symptoms:**
```
--- Initializing MQTT ---
Connecting to MQTT broker... Failed, rc=-2
```

**MQTT Error Codes:**
- `-4` = Connection timeout
- `-3` = Connection lost
- `-2` = Connection failed
- `-1` = Connection refused
- `0` = Connected
- `5` = Connection refused (bad credentials)

**Solutions:**

✅ **Check Broker IP and Port**
```cpp
// In kiosk_config.h
const char *mqttBroker = "192.168.1.100";  // Correct IP?
const int mqttPort = 1883;                  // Correct port?
```

Test broker from your computer:
```bash
# Ping broker
ping 192.168.1.100

# Test MQTT connection
mosquitto_sub -h 192.168.1.100 -t test -v
```

✅ **Check Firewall**
```bash
# Allow MQTT port
sudo ufw allow 1883/tcp

# Check if port is listening
sudo netstat -tlnp | grep 1883
```

✅ **Verify Broker Running**
```bash
# On server
sudo systemctl status mosquitto

# If not running
sudo systemctl start mosquitto
```

✅ **Check Same Network**
- ESP32 and server must be on same network
- Or server's firewall must allow external connections
- Check router routing rules

✅ **Test with Public Broker** (debugging only)
```cpp
const char *mqttBroker = "test.mosquitto.org";
const int mqttPort = 1883;
```
- If connects → your broker config issue
- If fails → ESP32/code issue

---

### ❌ Problem: MQTT Connects but No Messages

**Solutions:**

✅ **Check Topic Names**
- Topic names are case-sensitive
- Check for typos in kiosk ID
- Verify subscriber is using correct wildcard: `kiosk/+/user/scan`

✅ **Monitor Broker**
```bash
# Subscribe to all topics
mosquitto_sub -h localhost -t "#" -v
```

✅ **Check QoS Levels**
- QoS 0: Fire and forget (may lose messages)
- QoS 1: At least once (recommended)
- QoS 2: Exactly once (slower)

---

## 🔖 NFC/RFID Reader Issues

### ❌ Problem: "ERROR: PN532 not found! Check wiring."

**Solutions:**

✅ **Verify I2C Connections**
```
PN532 SDA → ESP32 GPIO 21
PN532 SCL → ESP32 GPIO 22
PN532 VCC → 3.3V or 5V
PN532 GND → GND
```

✅ **Check I2C Mode**
- PN532 must be in I2C mode (not SPI or HSU)
- Check DIP switches on back of module:
  ```
  SW1: OFF
  SW2: ON
  (I2C mode configuration)
  ```

✅ **Try Swapping SDA/SCL**
```cpp
// Some boards have these physically swapped
// Try in nfc_reader.h:
Wire.begin(22, 21);  // Instead of (21, 22)
```

✅ **Test I2C Scanner**
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
      Serial.printf("Device found at 0x%02X\n", addr);
    }
  }
  delay(5000);
}
```
- PN532 should appear at 0x24
- If not found → wiring or module issue

✅ **Check Power Supply**
- Verify voltage at PN532 VCC pin
- Should be 3.3V or 5V (depending on module)
- Check for loose connections

---

### ❌ Problem: "ERROR: MFRC522 not found! Check SPI wiring."

**Solutions:**

✅ **Verify SPI Connections**
```
MFRC522 RST  → ESP32 GPIO 27
MFRC522 SDA  → ESP32 GPIO 5
MFRC522 MOSI → ESP32 GPIO 23
MFRC522 MISO → ESP32 GPIO 19
MFRC522 SCK  → ESP32 GPIO 18
MFRC522 VCC  → 3.3V (⚠️ ONLY 3.3V!)
MFRC522 GND  → GND
```

✅ **⚠️ Check Voltage** 
```bash
# Use multimeter on MFRC522 VCC pin
# Must be 3.2-3.4V
# 5V will permanently damage MFRC522!
```

✅ **Check RST Pin**
- Must not be floating
- Verify GPIO 27 connection
- RST was moved from GPIO 22 (I2C conflict)

✅ **Test SPI**
```cpp
// Add to setup() before mfrc522.PCD_Init()
SPI.begin(18, 19, 23, 5);  // SCK, MISO, MOSI, SS
```

✅ **Check Solder Joints**
- MFRC522 modules often have poor solder
- Check each pin with multimeter for continuity
- Re-solder if needed

---

### ❌ Problem: Cards/Tags Not Detected

**Symptoms:**
- No "Card Detected" message when scanning
- Readers initialize OK but don't read cards

**Solutions:**

✅ **Distance**
- Bring card within 2-5cm of antenna
- NFC/RFID range is very limited
- Try different positions and angles

✅ **Card Compatibility**

**PN532 Supports:**
- MIFARE Classic 1K/4K
- MIFARE Ultralight
- NTAG213/215/216
- ISO14443A cards

**MFRC522 Supports:**
- MIFARE Classic 1K/4K
- MIFARE Ultralight  
- Most 13.56MHz ISO14443A tags

**Not Supported:**
- 125kHz tags (different frequency)
- EMV credit cards (encrypted)
- Some proprietary formats

✅ **Test with Known Good Card**
- Use standard MIFARE Classic card
- Available cheap on Amazon/eBay
- Eliminate card compatibility issue

✅ **Check Antenna**
- Verify antenna coil is properly connected
- Some modules have removable antenna
- Check for physical damage

✅ **Power Supply**
- Readers need stable power to generate RF field
- Check voltage doesn't drop during scan
- Try external power supply

---

## 🚪 Door Sensor Issues

### ❌ Problem: Door State Always Shows Same

**Solutions:**

✅ **Test Sensor Manually**
```cpp
// Upload simple test code
void setup() {
  Serial.begin(115200);
  pinMode(4, INPUT_PULLUP);
}

void loop() {
  int state = digitalRead(4);
  Serial.printf("GPIO 4: %d (%s)\n", state, state == LOW ? "CLOSED" : "OPEN");
  delay(500);
}
```

✅ **Verify Pullup**
- Code uses `INPUT_PULLUP`
- Disconnected = HIGH (open)
- Connected to GND = LOW (closed)

✅ **Check Wiring**
- Ensure GPIO 4 has good connection
- If using magnetic switch, check magnet distance
- If using touch sensor, verify power and ground

✅ **Swap to Different Pin** (if GPIO 4 issues)
```cpp
// Change in kiosk_main.ino
#define TOUCH_PIN 13  // Or another available GPIO
```

---

## 🔒 Solenoid Lock Issues

### ❌ Problem: Lock Not Activating

**Solutions:**

✅ **Test Directly**
```cpp
// Upload simple test
void setup() {
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

✅ **Check Relay Module**
- LED on relay should light when activated
- Listen for relay "click"
- If no click → relay not powered or GPIO issue
- If clicks but solenoid doesn't move → power/wiring issue

✅ **Solenoid Power**
- Verify solenoid power supply voltage (usually 12V)
- Check current rating (solenoids draw 0.5-2A typically)
- Measure voltage at solenoid when activated

✅ **Relay Wiring**
```
ESP32 GPIO 26  →  Relay IN
ESP32 GND      →  Relay GND
ESP32 5V       →  Relay VCC
12V+           →  Relay COM
Relay NO       →  Solenoid +
Solenoid -     →  12V-
```

✅ **Common Ground**
- Ensure ESP32 GND and 12V power GND are connected
- Without common ground, relay won't switch properly

---

## 💻 Compilation Errors

### ❌ Problem: Library Not Found

```
fatal error: Adafruit_PN532.h: No such file or directory
```

**Solutions:**

✅ **Install Missing Library**
- Arduino IDE: Sketch → Include Library → Manage Libraries
- PlatformIO: Check `platformio.ini` lib_deps

✅ **Correct Library Name**
- Must be exact: "Adafruit PN532" (not "PN532")
- "MFRC522" by GithubCommunity
- "PubSubClient" by Nick O'Leary

---

### ❌ Problem: ESP32 Board Not Found

```
Error: Board "esp32:esp32:esp32" not found
```

**Solutions:**

✅ **Install ESP32 Board Support**
- See [SETUP.md](SETUP.md) for full instructions
- Arduino IDE: Tools → Board → Boards Manager → Search "ESP32"
- Install "ESP32 by Espressif Systems"

---

## 📊 Serial Monitor Issues

### ❌ Problem: Garbage Characters / Random Symbols

**Symptoms:**
```
∆∏∂©√∫˜≤
```

**Solutions:**

✅ **Check Baud Rate**
- Must be **115200**
- Arduino IDE: Bottom right dropdown
- PlatformIO: Auto-set from platformio.ini

---

### ❌ Problem: No Serial Output

**Solutions:**

✅ **Check USB Cable**
- Must be data cable (not charge-only)
- Try different cable

✅ **Select Correct Port**
- Tools → Port → Select ESP32 port
- Windows: COM3, COM4, etc.
- Linux/Mac: /dev/ttyUSB0, /dev/cu.usbserial

✅ **Driver Issues (Windows)**
- Install CP2102 or CH340 USB driver
- Google: "ESP32 USB driver Windows"

---

## 🐛 Debug Techniques

### Enable Verbose Logging

```cpp
// Add to kiosk_main.ino
#define DEBUG 1

#if DEBUG
  #define DEBUG_PRINT(x) Serial.print(x)
  #define DEBUG_PRINTLN(x) Serial.println(x)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
#endif

// Use throughout code:
DEBUG_PRINTLN("Debug message");
```

### Monitor Memory

```cpp
void printMemory() {
  Serial.printf("Free heap: %d bytes\n", ESP.getFreeHeap());
}
```

### Test Individual Components

- Test PN532 alone first
- Then add MFRC522
- Then add WiFi
- Finally add MQTT
- Isolate which component causes issues

---

## 📞 Getting Help

If you're still stuck:

1. **Check Serial Monitor Output**
   - Copy full startup sequence
   - Include all error messages

2. **Document Your Setup**
   - ESP32 board type
   - Reader modules exact model
   - Library versions
   - Wiring photos

3. **Minimal Test Case**
   - Create simplest code that reproduces issue
   - Remove unrelated components

4. **Search Existing Issues**
   - Check project GitHub issues
   - Search Arduino forum
   - Check ESP32 forum

---

**Related Documentation:**
- [README.md](README.md) - Overview
- [SETUP.md](SETUP.md) - Initial setup
- [HARDWARE_WIRING.md](HARDWARE_WIRING.md) - Wiring details
- [MQTT_INTEGRATION.md](MQTT_INTEGRATION.md) - Server setup
