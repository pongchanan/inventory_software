#ifndef RFID_READER_H
#define RFID_READER_H

#include <SPI.h>
#include <MFRC522.h>

// MFRC522 SPI Pins
#define MFRC522_SS 5
#define MFRC522_RST 27

class RFIDReader {
private:
  MFRC522 mfrc522;

public:
  RFIDReader() : mfrc522(MFRC522_SS, MFRC522_RST) {}

  bool begin() {
    SPI.begin();
    mfrc522.PCD_Init();
    delay(50);

    byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
    if (version == 0x00 || version == 0xFF) {
      Serial.println("ERROR: MFRC522 not found! Check SPI wiring.");
      return false;
    }

    Serial.print("✓ MFRC522 Found! Version: 0x");
    Serial.println(version, HEX);
    Serial.println("✓ MFRC522 Ready.");
    return true;
  }

  String readCard() {
    if (!mfrc522.PICC_IsNewCardPresent()) return "";
    if (!mfrc522.PICC_ReadCardSerial()) return "";

    String uidString = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      if (mfrc522.uid.uidByte[i] < 0x10) uidString += "0";
      uidString += String(mfrc522.uid.uidByte[i], HEX);
    }
    uidString.toUpperCase();

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();

    return uidString;
  }
};

#endif
