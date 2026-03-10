#ifndef NFC_READER_H
#define NFC_READER_H

#include <Wire.h>
#include <Adafruit_PN532.h>

// PN532 I2C Pins (swapped on this board)
#define PN532_SDA 21
#define PN532_SCL 22

class NFCReader {
private:
  Adafruit_PN532 nfc;

public:
  NFCReader() : nfc(-1, -1, &Wire) {}

  bool begin() {
    Wire.begin(PN532_SDA, PN532_SCL);
    delay(100);
    nfc.begin();

    uint32_t versiondata = nfc.getFirmwareVersion();
    if (!versiondata) {
      Serial.println("ERROR: PN532 not found! Check wiring.");
      return false;
    }

    Serial.print("✓ PN532 Found! Firmware: 0x");
    Serial.println((versiondata >> 24) & 0xFF, HEX);
    nfc.SAMConfig();
    Serial.println("✓ PN532 Ready.");
    return true;
  }

  String readCard(uint16_t timeout = 50) {
    uint8_t uid[] = {0, 0, 0, 0, 0, 0, 0};
    uint8_t uidLength;

    bool success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, timeout);

    if (success) {
      String uidString = "";
      for (uint8_t i = 0; i < uidLength; i++) {
        if (uid[i] < 0x10) uidString += "0";
        uidString += String(uid[i], HEX);
      }
      uidString.toUpperCase();
      return uidString;
    }

    return "";  // No card detected
  }
};

#endif
