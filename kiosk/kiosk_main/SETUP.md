# Setup and Configuration Guide

Complete setup instructions for the Smart Kiosk Controller software.

## 📦 Software Requirements

- **PlatformIO** (recommended) OR **Arduino IDE** (v1.8.19+)
- **ESP32 Board Support**
- **Required Libraries:**
  - Adafruit PN532 (v1.2.2+)
  - MFRC522 (v1.4.10+)
  - PubSubClient (v2.8+)

## 🛠 Installation Methods

### Option 1: PlatformIO (Recommended)

#### Why PlatformIO?
- ✅ Automatic library management
- ✅ Better code intelligence
- ✅ Built-in serial monitor
- ✅ Consistent builds across machines
- ✅ Easy dependency updates

#### Installation Steps

1. **Install VS Code**
   - Download from [code.visualstudio.com](https://code.visualstudio.com/)

2. **Install PlatformIO Extension**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "PlatformIO IDE"
   - Click Install
   - Restart VS Code

3. **Open Kiosk Project**
   ```bash
   cd inventory_software/kiosk
   code .
   ```

4. **PlatformIO will auto-detect** the `platformio.ini` file and install:
   - ESP32 framework
   - All required libraries
   - Build tools

5. **Build the Project**
   - Click the checkmark icon (✓) in the bottom bar
   - Or use: `Ctrl+Alt+B`

6. **Upload to ESP32**
   - Connect ESP32 via USB
   - Click the arrow icon (→) in the bottom bar
   - Or use: `Ctrl+Alt+U`

---

### Option 2: Arduino IDE

#### Installation Steps

1. **Install Arduino IDE**
   - Download from [arduino.cc](https://www.arduino.cc/en/software)
   - Install version 1.8.19 or newer

2. **Add ESP32 Board Support**
   - Open Arduino IDE
   - Go to `File` → `Preferences`
   - In "Additional Board Manager URLs", add:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Click OK
   - Go to `Tools` → `Board` → `Boards Manager`
   - Search "ESP32"
   - Install "ESP32 by Espressif Systems"

3. **Install Required Libraries**
   
   Go to `Sketch` → `Include Library` → `Manage Libraries`
   
   Install each of these:
   
   | Library Name | Author | Version |
   |--------------|--------|---------|
   | Adafruit PN532 | Adafruit | Latest |
   | MFRC522 | GithubCommunity | Latest |
   | PubSubClient | Nick O'Leary | Latest |

4. **Select ESP32 Board**
   - Go to `Tools` → `Board` → `ESP32 Arduino`
   - Select your ESP32 model (e.g., "ESP32 Dev Module")

5. **Open Sketch**
   - `File` → `Open`
   - Navigate to `kiosk/kiosk_main/kiosk_main.ino`

6. **Compile and Upload**
   - Click the checkmark (✓) to verify/compile
   - Click the arrow (→) to upload

---

## ⚙️ Configuration

### 1. Configure WiFi and MQTT Settings

Edit `kiosk_config.h`:

```cpp
// WiFi Configuration
const char *ssid = "YOUR_WIFI_SSID";           // Change this
const char *password = "YOUR_WIFI_PASSWORD";   // Change this

// MQTT Configuration
const char *mqttBroker = "YOUR_SERVER_IP";     // e.g., "192.168.1.100"
const int mqttPort = 1883;                     // Default MQTT port
const char *kioskId = "kiosk_demo_01";         // Unique ID per kiosk
```

**Important Notes:**
- **WiFi SSID**: Must be 2.4GHz network (ESP32 doesn't support 5GHz)
- **WiFi Password**: Case-sensitive
- **MQTT Broker**: IP address of your server running MQTT broker
- **Kiosk ID**: Must be unique for each kiosk if you have multiple units

### 2. Generate Configuration Automatically (Optional)

If you have a `.env` file in your project root:

```bash
# From project root
npm run kiosk:config
```

This will auto-generate `kiosk_config.h` from your environment variables.

---

## 🔌 Connect and Upload

### 1. Connect ESP32 to Computer

- Use a USB cable (data cable, not charge-only)
- ESP32 should show up as a COM port (Windows) or /dev/ttyUSB0 (Linux/Mac)

### 2. Select Port

**PlatformIO:**
- Auto-detects port
- If multiple devices, select from dropdown in bottom bar

**Arduino IDE:**
- `Tools` → `Port` → Select your ESP32's port
- Windows: COM3, COM4, etc.
- Linux/Mac: /dev/ttyUSB0, /dev/cu.usbserial, etc.

### 3. Upload Code

**PlatformIO:**
```
Click → in bottom bar, or Ctrl+Alt+U
```

**Arduino IDE:**
```
Click → Upload button
```

**During Upload:**
- You may need to hold BOOT button on ESP32
- Release when "Connecting..." appears
- Wait for "Done uploading" message

---

## 📡 Serial Monitor Setup

### PlatformIO

1. Click the plug icon (🔌) in bottom bar
2. Or `Ctrl+Alt+S`
3. Baud rate: **115200** (auto-set from platformio.ini)

### Arduino IDE

1. `Tools` → `Serial Monitor`
2. Set baud rate to **115200** in dropdown
3. Set line ending to "Both NL & CR"

### Expected Output

```
--- Smart Kiosk System Starting ---
Connecting to WiFi: YourSSID
....
WiFi Connected. IP: 192.168.1.50

--- Initializing MQTT ---
Connecting to MQTT broker... Connected!
Subscribed to: kiosk/demo_01/command
Subscribed to: kiosk/all/broadcast
✓ MQTT Connected!

✓ PN532 Found! Firmware: 0x32
✓ PN532 Ready.
✓ MFRC522 Found! Version: 0x92
✓ MFRC522 Ready.

Door State: CLOSED
========================================
System Ready! Place a user NFC card...
========================================
```

---

## 🧪 Quick Test

### 1. Test NFC Reader (PN532)

- Place an NFC card near PN532
- Should see:
  ```
  *** NFC User Card Detected! ***
  UID: 04A1B2C3
  📤 Publishing user scan: 04A1B2C3
  ```

### 2. Test RFID Reader (MFRC522)

- After user authentication
- Open door (disconnect GPIO 4 from GND)
- Place RFID tag near MFRC522
- Should see:
  ```
  ✓ Item Added: 5A6B7C8D
  📤 Publishing item scan: 5A6B7C8D
  Total Items: 1
  ```

### 3. Test Door Sensor

- **Close door**: Connect GPIO 4 to GND
  - Serial: "Door State: CLOSED"
- **Open door**: Disconnect GPIO 4
  - Serial: "Door State: OPEN"

### 4. Test Solenoid Lock

- User authorization should trigger:
  ```
  [LOCK] Unlocked.
  ```
- Closing door should trigger:
  ```
  [LOCK] Locked.
  ```

---

## 📁 Project Structure

```
kiosk_main/
├── kiosk_main.ino          # Main program
├── kiosk_config.h          # Configuration file (EDIT THIS)
├── nfc_reader.h            # PN532 module
├── rfid_reader.h           # MFRC522 module
├── mqtt_client.h           # MQTT communication
├── README.md               # Main documentation
├── HARDWARE_WIRING.md      # Wiring guide
├── SETUP.md                # This file
├── MQTT_INTEGRATION.md     # MQTT server setup
└── TROUBLESHOOTING.md      # Common issues
```

---

## 🔄 Updating the Code

### PlatformIO

```bash
# Update libraries
pio lib update

# Clean build
pio run --target clean

# Rebuild and upload
pio run --target upload
```

### Arduino IDE

- `Sketch` → `Include Library` → `Manage Libraries`
- Update each library manually
- Recompile and upload

---

## 🌐 WiFi Troubleshooting

### Cannot Connect to WiFi

**Check:**
1. SSID and password are correct (case-sensitive)
2. Network is 2.4GHz, not 5GHz
3. Router allows new devices (not MAC filtered)
4. ESP32 is within range of router

**Test with Phone Hotspot:**
```cpp
const char *ssid = "MyPhoneHotspot";
const char *password = "12345678";
```

### WiFi Keeps Disconnecting

- ESP32 power supply may be insufficient (use quality USB cable)
- Add this to setup():
  ```cpp
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  ```

---

## 🔐 MQTT Broker Setup

Your kiosk needs an MQTT broker to communicate with. See [MQTT_INTEGRATION.md](MQTT_INTEGRATION.md) for complete server setup instructions.

**Quick Test (No Broker):**
The kiosk will fall back to offline mode if MQTT fails:
```
MQTT connection failed. Will retry...
MQTT Offline: Auto-granting access
```

---

## ✅ Setup Verification Checklist

Before production deployment:

- [ ] All libraries installed correctly
- [ ] Code compiles without errors
- [ ] ESP32 connects to WiFi
- [ ] MQTT broker connection established
- [ ] PN532 detected and reading cards
- [ ] MFRC522 detected and reading tags
- [ ] Door sensor responding correctly
- [ ] Solenoid lock activating (listen for click)
- [ ] Serial output shows no errors
- [ ] User authentication flow works
- [ ] Item scanning flow works
- [ ] Transactions published to MQTT

---

**Next Steps:**
- [MQTT_INTEGRATION.md](MQTT_INTEGRATION.md) - Set up backend MQTT broker
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Fix common issues
- [HARDWARE_WIRING.md](HARDWARE_WIRING.md) - Verify wiring if issues occur
