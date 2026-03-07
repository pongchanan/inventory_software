/*
 * PN532 NFC Reader Test
 * 
 * This sketch tests ONLY the PN532 NFC module.
 * Use this to verify your PN532 wiring before running the full kiosk system.
 * 
 * Wiring:
 * - PN532 SDA -> ESP32 GPIO 21
 * - PN532 SCL -> ESP32 GPIO 22
 * - PN532 VCC -> 3.3V or 5V (check your module)
 * - PN532 GND -> GND
 * 
 * Expected Output:
 * - "PN532 Found!" on startup
 * - "Card detected! UID: XXXXXXXX" when you tap a card
 */

#include <Wire.h>
#include <Adafruit_PN532.h>

// PN532 I2C Pins
#define PN532_SDA 21
#define PN532_SCL 22

Adafruit_PN532 nfc(-1, -1, &Wire);

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("PN532 NFC Reader Test");
  Serial.println("========================================\n");
  
  // Initialize I2C
  Wire.begin(PN532_SDA, PN532_SCL);
  delay(100);
  
  // Initialize PN532
  nfc.begin();
  
  // Check if PN532 is connected
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("❌ ERROR: PN532 not found!");
    Serial.println("\nTroubleshooting:");
    Serial.println("1. Check I2C wiring (SDA=21, SCL=22)");
    Serial.println("2. Verify power supply (3.3V or 5V)");
    Serial.println("3. Ensure PN532 is in I2C mode (check DIP switches)");
    Serial.println("4. Try swapping SDA/SCL if physically swapped on your board");
    while (1) {
      delay(1000);
    }
  }
  
  // PN532 found!
  Serial.println("✓ PN532 Found!");
  Serial.print("Firmware Version: 0x");
  Serial.println((versiondata >> 24) & 0xFF, HEX);
  
  // Configure PN532
  nfc.SAMConfig();
  
  Serial.println("\n========================================");
  Serial.println("Ready! Place an NFC card near the reader");
  Serial.println("========================================\n");
}

void loop() {
  uint8_t uid[] = {0, 0, 0, 0, 0, 0, 0};
  uint8_t uidLength;
  
  // Check for a card (timeout: 100ms)
  bool success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 100);
  
  if (success) {
    Serial.println("\n*** NFC Card Detected! ***");
    
    // Print UID in HEX format
    Serial.print("UID (HEX): ");
    String uidString = "";
    for (uint8_t i = 0; i < uidLength; i++) {
      if (uid[i] < 0x10) {
        Serial.print("0");
        uidString += "0";
      }
      Serial.print(uid[i], HEX);
      uidString += String(uid[i], HEX);
      if (i < uidLength - 1) Serial.print(" ");
    }
    Serial.println();
    
    // Print UID as string (uppercase)
    uidString.toUpperCase();
    Serial.print("UID (String): ");
    Serial.println(uidString);
    
    // Print UID length
    Serial.print("UID Length: ");
    Serial.print(uidLength);
    Serial.println(" bytes");
    
    Serial.println("\nWaiting for card removal...");
    
    // Wait for card to be removed
    delay(1000);
    
    Serial.println("Ready for next card!\n");
  }
  
  delay(50);
}
