# Hardware Wiring Guide

Complete wiring instructions for the Smart Kiosk Controller using ESP32.

## 📋 Components Required

- ESP32 Development Board
- PN532 NFC Module (I2C mode)
- MFRC522 RFID Module (SPI mode)
- Solenoid Lock (12V recommended)
- Relay Module or MOSFET (e.g., TIP120)
- Door Sensor (magnetic or touch sensor)
- Power Supply (5V for ESP32, appropriate voltage for solenoid)
- Jumper Wires

## 🔌 Pin Connections

### 1. PN532 NFC Module (User Card Reader) - I2C Mode

| PN532 Pin | ESP32 Pin | Description |
|-----------|-----------|-------------|
| VCC | 3.3V or 5V | Power supply (check module specs) |
| GND | GND | Ground |
| SDA | GPIO 21 | I2C Data |
| SCL | GPIO 22 | I2C Clock |
| IRQ | Not connected | Not used |
| RST | Not connected | Not used |

**Important Notes:**
- Ensure PN532 is configured for I2C mode (check DIP switches on back of module)
- Some boards have physically swapped SDA/SCL - check your specific module
- If using 5V module, ensure it has level shifters or is 3.3V tolerant

### 2. MFRC522 RFID Module (Item Tag Reader) - SPI Mode

| MFRC522 Pin | ESP32 Pin | Description |
|-------------|-----------|-------------|
| VCC | 3.3V | Power supply (⚠️ 3.3V ONLY!) |
| GND | GND | Ground |
| RST | GPIO 27 | Reset |
| SDA (SS) | GPIO 5 | Slave Select |
| MOSI | GPIO 23 | Master Out Slave In |
| MISO | GPIO 19 | Master In Slave Out |
| SCK | GPIO 18 | SPI Clock |

**Important Notes:**
- ⚠️ **ONLY 3.3V!** Connecting 5V will permanently damage the MFRC522
- RST pin was moved from GPIO 22 to GPIO 27 to avoid conflict with I2C
- Ensure good solder joints on all SPI pins for reliable communication

### 3. Solenoid Lock Control

| Component | Connection | Notes |
|-----------|------------|-------|
| ESP32 GPIO 26 | Relay/MOSFET Input | Control signal |
| Relay/MOSFET Output | Solenoid + | Switched power |
| Power Supply + | Relay/MOSFET VCC | 12V (or solenoid voltage) |
| Power Supply - | Solenoid - | Ground/Common |
| Power Supply - | ESP32 GND | Common ground |

**Circuit Logic:**
- `HIGH` (3.3V) on GPIO 26 → Relay activates → Solenoid unlocks
- `LOW` (0V) on GPIO 26 → Relay deactivates → Solenoid locks

**⚠️ Safety Warning:**
- **NEVER connect solenoid directly to ESP32 pin!** This will damage the ESP32
- Use a relay module (easy) or MOSFET driver circuit (efficient)
- Recommended: 5V relay module with optocoupler isolation
- Add flyback diode across solenoid coil to protect circuit from back-EMF

**Example Relay Module Connection:**
```
ESP32 GPIO 26 → Relay IN
ESP32 GND → Relay GND
ESP32 5V → Relay VCC
12V Power + → Relay COM
Relay NO → Solenoid +
Solenoid - → 12V Power -
```

### 4. Door Sensor

| Sensor Pin | ESP32 Pin | Description |
|------------|-----------|-------------|
| Signal | GPIO 4 | Digital input with pullup |
| VCC | 3.3V (optional) | For active sensors only |
| GND | GND | Ground |

**For Simple Wire Simulation:**
- **Door Closed**: Connect GPIO 4 to GND (short circuit)
- **Door Open**: Disconnect GPIO 4 (floating, pulled high internally)

**For Magnetic Reed Switch:**
- One wire to GPIO 4
- Other wire to GND
- When magnet is near (door closed), switch closes
- When magnet away (door open), switch opens

**For Touch Sensor:**
- VCC to 3.3V
- GND to GND
- OUT to GPIO 4
- Configure sensor for active-low output

**Note:** Code uses `INPUT_PULLUP` mode, so GPIO 4 is internally pulled to HIGH when not connected.

## 🔧 Assembly Tips

### Power Supply Considerations

1. **ESP32**: 5V via USB or VIN pin (regulated to 3.3V onboard)
2. **PN532**: Check module specs - some use 5V, some 3.3V
3. **MFRC522**: Always 3.3V only
4. **Solenoid**: Typically 12V DC (check your specific lock)

**Recommended Setup:**
- USB power bank (5V) for ESP32 during development
- 12V DC adapter for solenoid lock
- Common ground between all power supplies

### Wiring Best Practices

- Use **short wires** for SPI and I2C (< 20cm if possible)
- **Twist** SDA/SCL pairs together to reduce noise
- **Separate** power wires from signal wires
- Use **different colored** wires for VCC, GND, and signals
- Add **0.1µF ceramic capacitors** near each module's VCC/GND for stability
- Secure all connections with **heat shrink** or **solder**

### Common Ground

⚠️ **Critical:** All components must share a common ground:
```
ESP32 GND ───┬─── PN532 GND
             ├─── MFRC522 GND
             ├─── Relay GND
             └─── Power Supply GND
```

## 🧪 Testing Individual Components

### Test PN532
```cpp
// Upload just the PN532 test code
#include <Wire.h>
#include <Adafruit_PN532.h>
Adafruit_PN532 nfc(-1, -1, &Wire);

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  nfc.begin();
  if (nfc.getFirmwareVersion()) {
    Serial.println("PN532 OK!");
  }
}
```

### Test MFRC522
```cpp
// Upload just the MFRC522 test code
#include <SPI.h>
#include <MFRC522.h>
MFRC522 mfrc522(5, 27);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
  byte v = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.printf("MFRC522 Version: 0x%02X\n", v);
}
```

### Test Solenoid Lock
```cpp
// Test relay/solenoid control
void setup() {
  pinMode(26, OUTPUT);
}

void loop() {
  digitalWrite(26, HIGH); // Unlock
  delay(3000);
  digitalWrite(26, LOW);  // Lock
  delay(3000);
}
```

### Test Door Sensor
```cpp
// Test door sensor reading
void setup() {
  Serial.begin(115200);
  pinMode(4, INPUT_PULLUP);
}

void loop() {
  int state = digitalRead(4);
  Serial.println(state == LOW ? "CLOSED" : "OPEN");
  delay(500);
}
```

## 🔍 Voltage Testing

Before connecting everything, verify voltages with a multimeter:

| Point | Expected Voltage |
|-------|------------------|
| ESP32 3.3V pin | 3.2-3.4V |
| ESP32 5V pin | 4.8-5.2V |
| PN532 VCC | 3.3V or 5V (depends on module) |
| MFRC522 VCC | 3.2-3.4V |
| Relay VCC | 5V |
| Solenoid supply | 12V (or rated voltage) |

## 📸 Wiring Diagram

```
                         ESP32
                    ┌────────────┐
        [PN532]─────│ 21,22 (I2C)│
                    │            │
     [MFRC522]──────│5,18,19,23  │
                    │   27 (SPI) │
                    │            │
  [Door Sensor]─────│ 4 (INPUT)  │
                    │            │
 [Relay Module]─────│ 26 (OUTPUT)│────[Solenoid Lock]
                    │            │
        GND─────────│ GND        │
        5V──────────│ 5V         │
                    └────────────┘
```

## ⚠️ Safety Checklist

Before powering on:

- [ ] Double-check all VCC connections (3.3V vs 5V)
- [ ] Verify MFRC522 is connected to 3.3V only
- [ ] Ensure common ground across all components
- [ ] Check solenoid is NOT directly connected to ESP32
- [ ] Verify relay/MOSFET is properly rated for solenoid current
- [ ] Confirm PN532 DIP switches are set to I2C mode
- [ ] Check for any short circuits with multimeter
- [ ] Verify power supply voltages before connecting

---

**Next Steps:** Once hardware is connected, proceed to [SETUP.md](SETUP.md) for software configuration.
