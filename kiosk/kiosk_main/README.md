# Smart Kiosk Controller (ESP32)

An MQTT-enabled smart inventory kiosk system with dual NFC/RFID readers for automated item tracking.

## 🚀 Quick Start

1. **[Hardware Wiring](HARDWARE_WIRING.md)** - Connect all components
2. **[Testing](TESTING.md)** - Test each component separately
3. **[Setup & Installation](SETUP.md)** - Install software and libraries
4. **[MQTT Integration](MQTT_INTEGRATION.md)** - Configure server and broker
5. **[Troubleshooting](TROUBLESHOOTING.md)** - Fix common issues

## 📋 System Overview

### Hardware
- **ESP32** - Main controller with WiFi
- **PN532 (I2C)** - User NFC card reader for authentication
- **MFRC522 (SPI)** - Item RFID tag scanner  
- **Solenoid Lock** - Electronic cabinet lock
- **Door Sensor** - Detects cabinet open/close

### Communication
- **Protocol:** MQTT over WiFi
- **Real-time:** Bi-directional messaging
- **Features:** Remote control, live monitoring, emergency broadcasts
- **Fallback:** Offline mode if MQTT unavailable

### Communication
- **Protocol:** MQTT over WiFi
- **Real-time:** Bi-directional messaging
- **Features:** Remote control, live monitoring, emergency broadcasts
- **Fallback:** Offline mode if MQTT unavailable

## 🔌 Pin Connections (Quick Reference)

| Component | ESP32 Pins | Mode |
|-----------|------------|------|
| PN532 (User NFC) | GPIO 21 (SDA), 22 (SCL) | I2C |
| MFRC522 (Item RFID) | GPIO 5 (SS), 18 (SCK), 19 (MISO), 23 (MOSI), 27 (RST) | SPI |
| Solenoid Lock | GPIO 26 (via relay) | Output |
| Door Sensor | GPIO 4 | Input w/ Pullup |

**⚠️ Important:** 
- MFRC522 uses 3.3V only (5V will damage it)
- Solenoid must use relay/MOSFET (never direct to ESP32)

📖 **Full wiring guide:** [HARDWARE_WIRING.md](HARDWARE_WIRING.md)

## ⚙️ Configuration

Edit `kiosk_config.h`:

```cpp
// WiFi (2.4GHz only)
const char *ssid = "YOUR_WIFI_SSID";
const char *password = "YOUR_WIFI_PASSWORD";

// MQTT Broker
const char *mqttBroker = "192.168.1.100";  // Your server IP
const int mqttPort = 1883;
const char *kioskId = "kiosk_demo_01";     // Unique per kiosk
```

📖 **Full setup guide:** [SETUP.md](SETUP.md)

## 📡 How It Works

### User Workflow
```
1. User taps NFC card → PN532 reads UID
2. Kiosk publishes to MQTT → Server validates user
3. Server responds with auth → Kiosk unlocks if approved
4. Door opens → User scans items with MFRC522
5. Door closes → Kiosk publishes transactions to MQTT
6. Cabinet locks → Ready for next user
```

### MQTT Topics

**Kiosk Publishes:**
- `kiosk/{id}/user/scan` - User card scanned
- `kiosk/{id}/item/scan` - Item tag scanned
- `kiosk/{id}/transaction` - Transaction record
- `kiosk/{id}/status` - Kiosk state changes
- `kiosk/{id}/door` - Door open/close

**Kiosk Subscribes:**
- `kiosk/{id}/command` - Remote lock/unlock
- `kiosk/{id}/auth/response` - User authorization
- `kiosk/all/broadcast` - Emergency commands

📖 **Full MQTT reference:** [MQTT_INTEGRATION.md](MQTT_INTEGRATION.md)

## 📁 Code Structure

```
kiosk_main/
├── kiosk_main.ino          # Main state machine & logic
├── kiosk_config.h          # Configuration (EDIT THIS)
├── nfc_reader.h            # PN532 module
├── rfid_reader.h           # MFRC522 module
├── mqtt_client.h           # MQTT communication
├── test_nfc_pn532.ino      # PN532 test (standalone)
├── test_rfid_mfrc522.ino   # MFRC522 test (standalone)
├── README.md               # This file
├── HARDWARE_WIRING.md      # Wiring guide
├── TESTING.md              # Component testing guide
├── SETUP.md                # Setup instructions
├── MQTT_INTEGRATION.md     # Server/broker setup
└── TROUBLESHOOTING.md      # Common issues
```

### Module Overview

**`nfc_reader.h`** - User authentication reader
- Handles PN532 I2C communication
- Method: `readCard()` returns user UID

**`rfid_reader.h`** - Item tag scanner  
- Handles MFRC522 SPI communication
- Method: `readCard()` returns item UID

**`mqtt_client.h`** - MQTT communication
- Manages broker connection
- Publishing: events, status, transactions
- Subscribing: commands, auth responses
- Auto-reconnection on disconnect

**`kiosk_main.ino`** - Main controller
- State machine orchestration
- Door monitoring
- Session management
- Integrates all modules

## 📊 State Machine

```
IDLE → User scans NFC card
  ↓
VERIFYING_USER → Waiting for MQTT auth response
  ↓ (authorized)
WAITING_FOR_DOOR_OPEN → Monitoring door sensor
  ↓ (door opens)
WAITING_FOR_ACTION → Scanning items, monitoring door
  ↓ (door closes)
REPORTING → Publishing transactions via MQTT
  ↓
IDLE → Ready for next user
```

## 🧪 Testing

### Quick Component Tests

Before running the full system, test each component separately:

1. **PN532 NFC Reader:** Upload `test_nfc_pn532.ino`
   - Verifies PN532 detection and card reading
   
2. **MFRC522 RFID Reader:** Upload `test_rfid_mfrc522.ino`
   - Verifies MFRC522 detection and tag reading

📖 **Complete testing guide:** [TESTING.md](TESTING.md)

### Expected Serial Output (Full System)

```
--- Smart Kiosk System Starting ---
Connecting to WiFi: YourSSID
WiFi Connected. IP: 192.168.1.50

--- Initializing MQTT ---
Connecting to MQTT broker... Connected!
✓ MQTT Connected!

✓ PN532 Found! Firmware: 0x32
✓ PN532 Ready.
✓ MFRC522 Found! Version: 0x92
✓ MFRC522 Ready.

System Ready! Place a user NFC card...
```

### Test Sequence

1. **User Scan:** Tap NFC card on PN532
   - Should see: "User Card Detected! UID: ..."
2. **Authorization:** Wait for MQTT response
   - Should see: "User Authorized! Access Granted."
3. **Door Open:** Disconnect GPIO 4 from GND
   - Should see: "Door Opened. Ready for item scan."
4. **Item Scan:** Tap RFID tags on MFRC522
   - Should see: "Item Added: ... Total Items: X"
5. **Door Close:** Connect GPIO 4 to GND
   - Should see: "Door Closed. Locking..."
6. **Reporting:** Transactions published
   - Should see: "Session Complete"

## 🚀 Deployment Checklist

- [ ] Hardware assembled per [HARDWARE_WIRING.md](HARDWARE_WIRING.md)
- [ ] Software installed per [SETUP.md](SETUP.md)
- [ ] MQTT broker running per [MQTT_INTEGRATION.md](MQTT_INTEGRATION.md)
- [ ] WiFi credentials configured
- [ ] MQTT broker IP configured
- [ ] Unique kiosk ID set
- [ ] All readers detected successfully
- [ ] Door sensor responding
- [ ] Solenoid lock activating
- [ ] MQTT connection established
- [ ] User auth flow tested
- [ ] Item scanning tested
- [ ] Transactions saving to backend
- [ ] Remote lock command tested

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[HARDWARE_WIRING.md](HARDWARE_WIRING.md)** | Complete wiring guide, pin connections, safety notes |
| **[TESTING.md](TESTING.md)** | Test individual components before full integration |
| **[SETUP.md](SETUP.md)** | Software installation, library setup, configuration |
| **[MQTT_INTEGRATION.md](MQTT_INTEGRATION.md)** | MQTT broker setup, backend integration, topics reference |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Common issues, debugging, solutions |

## ⚠️ Common Issues

| Problem | Quick Fix | Full Guide |
|---------|-----------|------------|
| WiFi won't connect | Check SSID/password, use 2.4GHz | [TROUBLESHOOTING.md](TROUBLESHOOTING.md#-wifi-issues) |
| MQTT connection fails | Verify broker IP, check firewall | [TROUBLESHOOTING.md](TROUBLESHOOTING.md#-mqtt-issues) |
| PN532 not found | Check I2C wiring, verify mode switches | [TROUBLESHOOTING.md](TROUBLESHOOTING.md#-nfcrfid-reader-issues) |
| MFRC522 not found | Check SPI wiring, ensure 3.3V power | [TROUBLESHOOTING.md](TROUBLESHOOTING.md#-nfcrfid-reader-issues) |
| Cards not detected | Bring closer, check card compatibility | [TROUBLESHOOTING.md](TROUBLESHOOTING.md#-nfcrfid-reader-issues) |

## 🔧 Advanced Features

### Remote Control

Lock kiosk from server:
```javascript
mqtt.publish('kiosk/demo_01/command', '{"command":"lock"}');
```

### Emergency Lockdown

Lock all kiosks:
```javascript
mqtt.publish('kiosk/all/broadcast', '{"emergency_lock":true}');
```

### Real-Time Monitoring

Subscribe to all kiosk events:
```bash
mosquitto_sub -h YOUR_SERVER -t "kiosk/#" -v
```

## 📝 License & Credits

Part of the Inventory Management Software project.

**Libraries:**
- Adafruit PN532 Library
- MFRC522 by GithubCommunity  
- PubSubClient (MQTT) by Nick O'Leary
- ESP32 Arduino Core

---

**Need Help?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or review the [API Documentation](../../backend/API_DOCUMENTATION.md)