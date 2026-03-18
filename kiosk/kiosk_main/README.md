# Kiosk Controller — ESP32

Arduino firmware for the smart inventory kiosk. Uses two RFID readers (PN532 for user NFC cards, MFRC522 for item tags), a solenoid lock, and a door sensor. Communicates with the backend exclusively over **MQTT**.

## 🔌 Hardware Connections

### 1. PN532 NFC Module (User Card) — I2C
| PN532 Pin | ESP32 Pin |
|---|---|
| SDA | GPIO 21 |
| SCL | GPIO 22 |
| VCC | 3.3V or 5V |
| GND | GND |
| IRQ / RST | Not connected |

### 2. MFRC522 RFID Module (Item Tag) — SPI
| MFRC522 Pin | ESP32 Pin |
|---|---|
| SDA (SS) | GPIO 5 |
| SCK | GPIO 18 |
| MOSI | GPIO 23 |
| MISO | GPIO 19 |
| RST | GPIO 27 |
| VCC | 3.3V |
| GND | GND |

### 3. Solenoid Lock
| Signal | ESP32 Pin |
|---|---|
| Control | GPIO 26 (HIGH = unlock, LOW = lock) |

> ⚠️ Drive the solenoid via a relay module or MOSFET (e.g. TIP120). Do **not** connect it directly to the ESP32 pin.

### 4. Door Sensor
| State | GPIO 4 |
|---|---|
| Closed | Connected to GND (reads LOW) |
| Open | Disconnected (reads HIGH via INPUT\_PULLUP) |

---

## ⚙️ Configuration

`kiosk_config.h` is **auto-generated** — do not edit it by hand.

1. Set values in the **root `.env`** file:
   ```dotenv
   WIFI_SSID=YourNetwork
   WIFI_PASSWORD=YourPassword
   NEXT_PUBLIC_API_URL=http://192.168.1.100:3000

   MOSQUITTO_TCP_HOST=your.mqtt.broker
   MOSQUITTO_TCP_PORT=1883
   MOSQUITTO_USER=your_mqtt_user
   JWT_SECRET=your_jwt_secret   # used as MQTT password
   ```
2. Run the generator from the repo root:
   ```bash
   npm run kiosk:config
   ```
   This writes `kiosk/kiosk_main/kiosk_config.h` with all credentials.

> `kiosk_config.h` is gitignored so credentials are never committed.

---

## 📡 MQTT Communication

All backend communication goes through MQTT via the helper header `kiosk_mqtt.h`.

### Topics the kiosk **publishes**
| Topic | Payload | When |
|---|---|---|
| `kiosk/open_cabinet` | `{"rfid": "<NFC UID>"}` | User taps NFC card |
| `kiosk/register_card` | `{"uid": "<RFID UID>"}` | Card scanned during registration |
| `kiosk/heartbeat` | `{"status": "alive", "uptime_ms": ...}` | Periodic liveness ping |

### Topics the kiosk **subscribes**
| Topic | Payload | What to do |
|---|---|---|
| `kiosk/response` | `{"status": "ok|error", "message": "..."}` | Unlock cabinet on `ok`, show error otherwise |

### Using `kiosk_mqtt.h`

```cpp
#include "kiosk_config.h"
#include "kiosk_mqtt.h"

void onResponse(const String& payload) {
    JsonDocument doc;
    deserializeJson(doc, payload);
    if (strcmp(doc["status"], "ok") == 0) {
        unlockCabinet();
    }
}

void setup() {
    // ... WiFi setup ...
    mqtt_set_response_callback(onResponse);
    mqtt_connect();
}

void loop() {
    mqtt_loop();  // must be called every iteration
    // on NFC scan:
    // mqtt_publish_open_cabinet(rfidUid);
}
```

---

## 🛠 Required Libraries

Install via **Arduino Library Manager**:

| Library | Author |
|---|---|
| Adafruit PN532 | Adafruit |
| MFRC522 | GithubCommunity |
| PubSubClient | Nick O'Leary |
| ArduinoJson | Benoit Blanchon |
| WiFi / HTTPClient | Built-in (ESP32) |

---

## 📁 Files

| File | Description |
|---|---|
| `kiosk_main.ino` | Main sketch — state machine, hardware reads |
| `kiosk_mqtt.h` | MQTT pub/sub helper (topics, connect, loop, publish functions) |
| `kiosk_config.h` | Auto-generated credentials (gitignored) |


## 🔌 Hardware Connections

### 1. PN532 NFC Module (User Card Reader) - **I2C Mode**
*   **SDA**: `GPIO 21`
*   **SCL**: `GPIO 22`
*   **VCC**: 3.3V or 5V (Check module capability)
*   **GND**: GND
*   **IRQ / RST**: Not used in this sketch. Left unconnected.

### 2. MFRC522 RFID Module (Item Tag Reader) - **SPI Mode**
*   **SDA (SS)**: `GPIO 5`
*   **SCK**: `GPIO 18`
*   **MOSI**: `GPIO 23`
*   **MISO**: `GPIO 19`
*   **RST**: `GPIO 27` (Note: Changed from 22 to avoid I2C conflict)
*   **VCC**: 3.3V
*   **GND**: GND

### 3. Solenoid Lock
*   **Control Pin**: `GPIO 26`
    *   **High (3.3V)**: Unlocks (Power ON)
    *   **Low (0V)**: Locks (Power OFF)
*   *Note: Use a Relay Module or MOSFET (e.g., TIP120) to drive the solenoid. Do NOT connect solenoid directly to ESP32 pin!*

### 4. Door Sensor (Simulated with Wire)
*   **Pin**: `GPIO 4`
    *   **Method**: Digital Input with Internal Pullup.
    *   **Closed**: Connect Pin 4 to GND (Simulates door closed/touched).
    *   **Open**: Disconnect Pin 4 (Simulates door open).
    *   *Note: Using digitalRead logic avoids ADC2 conflicts with WiFi.*

## 🛠 Libraries Required
Ensure these are installed in Arduino IDE:
1.  **Adafruit PN532** (by Adafruit)
2.  **MFRC522** (by GithubCommunity/others)
3.  **WiFi** & **HTTPClient** (Built-in for ESP32)

## ⚙️ Configuration
In `kiosk_main.ino`, update:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:3000";
```
