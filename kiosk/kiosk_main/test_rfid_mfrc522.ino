/*
 * MFRC522 RFID Reader Test
 * 
 * This sketch tests ONLY the MFRC522 RFID module.
 * Use this to verify your MFRC522 wiring before running the full kiosk system.
 * 
 * Wiring:
 * - MFRC522 RST  -> ESP32 GPIO 27
 * - MFRC522 SDA  -> ESP32 GPIO 5
 * - MFRC522 MOSI -> ESP32 GPIO 23
 * - MFRC522 MISO -> ESP32 GPIO 19
 * - MFRC522 SCK  -> ESP32 GPIO 18
 * - MFRC522 VCC  -> 3.3V (⚠️ ONLY 3.3V! 5V will damage it!)
 * - MFRC522 GND  -> GND
 * 
 * Expected Output:
 * - "MFRC522 Found!" on startup
 * - "Card detected! UID: XXXXXXXX" when you tap a tag
 */

#include <SPI.h>
#include <MFRC522.h>

// MFRC522 SPI Pins
#define MFRC522_SS  5
#define MFRC522_RST 27

MFRC522 mfrc522(MFRC522_SS, MFRC522_RST);

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("MFRC522 RFID Reader Test");
  Serial.println("========================================\n");
  
  // Initialize SPI
  SPI.begin();
  
  // Initialize MFRC522
  mfrc522.PCD_Init();
  delay(50);
  
  // Check if MFRC522 is connected
  byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  
  if (version == 0x00 || version == 0xFF) {
    Serial.println("❌ ERROR: MFRC522 not found!");
    Serial.println("\nTroubleshooting:");
    Serial.println("1. Check SPI wiring (SS=5, RST=27, SCK=18, MISO=19, MOSI=23)");
    Serial.println("2. ⚠️  Verify 3.3V power (5V will damage MFRC522!)");
    Serial.println("3. Check RST pin connection");
    Serial.println("4. Verify solder joints on all pins");
    while (1) {
      delay(1000);
    }
  }
  
  // MFRC522 found!
  Serial.println("✓ MFRC522 Found!");
  Serial.print("Firmware Version: 0x");
  Serial.println(version, HEX);
  
  // Show details
  mfrc522.PCD_DumpVersionToSerial();
  
  Serial.println("\n========================================");
  Serial.println("Ready! Place an RFID tag near the reader");
  Serial.println("========================================\n");
}

void loop() {
  // Check for new cards
  if (!mfrc522.PICC_IsNewCardPresent()) {
    delay(50);
    return;
  }
  
  // Select one of the cards
  if (!mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }
  
  Serial.println("\n*** RFID Tag Detected! ***");
  
  // Print UID in HEX format
  Serial.print("UID (HEX): ");
  String uidString = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) {
      Serial.print("0");
      uidString += "0";
    }
    Serial.print(mfrc522.uid.uidByte[i], HEX);
    uidString += String(mfrc522.uid.uidByte[i], HEX);
    if (i < mfrc522.uid.size - 1) Serial.print(" ");
  }
  Serial.println();
  
  // Print UID as string (uppercase)
  uidString.toUpperCase();
  Serial.print("UID (String): ");
  Serial.println(uidString);
  
  // Print UID length
  Serial.print("UID Length: ");
  Serial.print(mfrc522.uid.size);
  Serial.println(" bytes");
  
  // Print card type
  Serial.print("Card Type: ");
  MFRC522::PICC_Type piccType = mfrc522.PICC_GetType(mfrc522.uid.sak);
  Serial.println(mfrc522.PICC_GetTypeName(piccType));
  
  // Halt PICC
  mfrc522.PICC_HaltA();
  
  // Stop encryption on PCD
  mfrc522.PCD_StopCrypto1();
  
  Serial.println("\nReady for next tag!\n");
  
  delay(1000);
}
