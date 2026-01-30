# Kiosk Controller Wiring Guide (ESP32)

This sketch controls a smart inventory kiosk with two RFID readers (PN532 for User ID, MFRC522 for Item ID), a Solenoid Lock, and a Touch Sensor simulated door switch.

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
