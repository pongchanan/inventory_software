#include <Adafruit_PN532.h>
#include <ArduinoOTA.h>
#include <HTTPClient.h>
#include <MFRC522.h>
#include <SPI.h>
#include <WiFi.h>
#include <Wire.h>
#include <vector>

// --- Configuration ---
#include "kiosk_config.h"

// --- Pins Definition ---

// 1. PN532 (I2C) - Uses Wire (SDA=21, SCL=22 on ESP32 default)
#define PN532_SDA 21
#define PN532_SCL 22
// IRQ Not connected for simple polling. Defined as dummy to satisfy
// constructor.
#define PN532_IRQ_DUMMY 33
// RESET Not connected. Defined as dummy.
#define PN532_RESET_DUMMY 25

// 2. MFRC522 (SPI) - Uses HSPI/VSPI Default (SCK=18, MISO=19, MOSI=23)
#define MFRC522_SS 5
#define MFRC522_RST 27 // Changed from 22 to avoid conflict with I2C SCL (22)

// 3. Solenoid Lock
#define LOCK_PIN 26 // Logic HIGH to unlock (supply power), LOW to lock

// 4. Touch Sensor (or Switch) for Door Status
// WARNING: ADC2 (touchRead) on GPIO 4 is disabled when WiFi is active.
// Fix: Use digitalRead(4) with Internal Pullup.
// Connect Pin 4 to GND to simulate "Door Closed". Disconnect to simulate "Door
// Open".
#define TOUCH_PIN 4

// --- Objects ---
// Use Hardware I2C. The library will call Wire.begin() internally.
// We pass dummy pins because we are using I2C polling, not IRQ interrupts.
Adafruit_PN532 nfc(PN532_IRQ_DUMMY, PN532_RESET_DUMMY);

MFRC522 mfrc522(MFRC522_SS, MFRC522_RST);

// --- State Machine ---
enum State {
  IDLE,                  // Waiting for User Card
  VERIFYING_USER,        // Checking API
  CABINET_UNLOCKED,      // Door Unlocked
  WAITING_FOR_DOOR_OPEN, // Wait for door to open (Touch > Threshold)
  WAITING_FOR_ACTION,    // Waiting for Item Scan OR Door Close
  REPORTING              // Sending Data
};

State currentState = IDLE;
String currentUserId = "";
std::vector<String> scannedItems; // Uses standard library vector

// Forward Declarations
void checkUserScan();
bool checkUserAuthorization(String uid);
void unlockCabinet();
void lockCabinet();
void checkItemScan();
void checkCabinetClose();
void sendTransactionData(String user, String item);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- Smart Kiosk System Starting (ESP32) ---");

  // Lock Setup
  pinMode(LOCK_PIN, OUTPUT);
  digitalWrite(LOCK_PIN, LOW); // Start Locked (LOW)

  // Use INPUT_PULLUP for Door Sensor
  // LOW = Grounded (Closed). HIGH = Floating (Open).
  pinMode(TOUCH_PIN, INPUT_PULLUP);

  // WiFi Setup
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  // Wait for WiFi
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    delay(500);
    Serial.print(".");
    timeout++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected. IP: ");
    Serial.println(WiFi.localIP());

    // --- Setup OTA ---
    ArduinoOTA.setHostname("kiosk-smart-inventory");
    ArduinoOTA.onStart([]() {
      String type;
      if (ArduinoOTA.getCommand() == U_FLASH)
        type = "sketch";
      else // U_SPIFFS
        type = "filesystem";
      Serial.println("Start updating " + type);
    });
    ArduinoOTA.onEnd([]() { Serial.println("\nEnd"); });
    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
      Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
    });
    ArduinoOTA.onError([](ota_error_t error) {
      Serial.printf("Error[%u]: ", error);
      if (error == OTA_AUTH_ERROR)
        Serial.println("Auth Failed");
      else if (error == OTA_BEGIN_ERROR)
        Serial.println("Begin Failed");
      else if (error == OTA_CONNECT_ERROR)
        Serial.println("Connect Failed");
      else if (error == OTA_RECEIVE_ERROR)
        Serial.println("Receive Failed");
      else if (error == OTA_END_ERROR)
        Serial.println("End Failed");
    });
    ArduinoOTA.begin();
    Serial.println("OTA Ready");

  } else {
    Serial.println("\nWiFi Failed (Offline Mode).");
  }

  // PN532 Setup (I2C)
  // Ensure Wire is started on standard pins.
  Wire.begin(PN532_SDA, PN532_SCL);

  nfc.begin();

  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("Error: PN532 not found.");
    // We don't halt ('while(1)') so you can at least debug other parts,
    // but the system won't work fully.
  } else {
    Serial.print("Found PN532. Ver: ");
    Serial.println((versiondata >> 24) & 0xFF, HEX);
    nfc.SAMConfig(); // Configure board to read RFID tags
  }

  // MFRC522 Setup (SPI)
  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println("MFRC522 Initialized.");

  // Door Sensor calibration (optional, just print initial value)
  Serial.print("Initial Door State (Pin 4): ");
  Serial.println(digitalRead(TOUCH_PIN) == LOW ? "CLOSED (GND)"
                                               : "OPEN (Floating)");

  Serial.println("System Ready. Waiting for User...");
}

void loop() {
  ArduinoOTA.handle();

  switch (currentState) {
  case IDLE:
    checkUserScan();
    break;

  case VERIFYING_USER:
    if (checkUserAuthorization(currentUserId)) {
      Serial.println("Access Granted. Unlocking...");
      unlockCabinet();
      // Clear previous session items
      scannedItems.clear();

      // Wait for user to actually OPEN the door before checking for close
      currentState = WAITING_FOR_DOOR_OPEN;
      Serial.println(
          "STATE: Waiting for Door to OPEN (Release touch sensor)...");
    } else {
      Serial.println("Access Denied.");
      currentState = IDLE;
    }
    break;

  case WAITING_FOR_DOOR_OPEN: {
    int doorState = digitalRead(TOUCH_PIN);
    // With INPUT_PULLUP, HIGH means open (floating), LOW means closed
    // (grounded)
    if (doorState == HIGH) {
      Serial.print("Door Opened (State: HIGH/OPEN). Ready for Item Scan.");
      currentState = WAITING_FOR_ACTION;
    } else {
      // Print debug every 1 second
      static unsigned long lastPrint = 0;
      if (millis() - lastPrint > 1000) {
        lastPrint = millis();
        Serial.print("Still Closed/Touched. State: LOW/CLOSED\n");
      }
    }
  }
  // Optional: Timeout if they never open it?
  break;

  case WAITING_FOR_ACTION:
    // Allow User to Scan Item
    checkItemScan();

    // Also check if they close the door (end session)
    checkCabinetClose();
    break;

  case REPORTING:
    Serial.println("--- Reporting Transactions ---");
    if (scannedItems.empty()) {
      Serial.println("No items scanned.");
      sendTransactionData(currentUserId, ""); // Send empty/null record?
    } else {
      for (const String &item : scannedItems) {
        sendTransactionData(currentUserId, item);
        delay(500); // Small delay between requests
      }
    }

    // Reset Session
    currentUserId = "";
    scannedItems.clear();
    lockCabinet(); // Ensure locked

    currentState = IDLE;
    Serial.println("Session Ended. Idle.");
    break;
  }

  // Small delay to prevent tight loop bombardment
  delay(50);
}

// --- Helper Functions ---

void checkUserScan() {
  uint8_t success;
  uint8_t uid[] = {0, 0, 0, 0, 0, 0, 0};
  uint8_t uidLength;

  // 50ms timeout to keep loop responsive
  // Note: readPassiveTargetID is blocking for the timeout duration if no card
  // is present.
  success =
      nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50);

  if (success) {
    Serial.println("User Card Detected!");
    currentUserId = "";
    for (uint8_t i = 0; i < uidLength; i++) {
      if (uid[i] < 0x10)
        currentUserId += "0";
      currentUserId += String(uid[i], HEX);
    }
    currentUserId.toUpperCase();
    Serial.print("UID: ");
    Serial.println(currentUserId);
    currentState = VERIFYING_USER;
  }
}

bool checkUserAuthorization(String uid) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    // --- STEP 1: Check existing user authorization ---
    // Construct API URL
    // e.g., http://192.168.1.100:3000/api/users/UID1234
    String url = String(serverUrl) + "/api/users/" + uid;

    Serial.print("Checking API: ");
    Serial.println(url);

    http.begin(url);
    int httpCode = http.GET();

    if (httpCode > 0) {
      Serial.printf("API Response Code: %d\n", httpCode);
      // Assume 200 OK means authorized.
      if (httpCode == 200) {
        http.end();
        return true;
      }
    } else {
      Serial.printf("API Error: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();

    // --- STEP 2: Registration Fallback ---
    // If not 200 OK (e.g., 404 Not Found), try the Registration flow.
    if (httpCode != 200) {
      Serial.println(
          "Card not authorized or not found. Trying Registration Flow...");

      String regUrl = String(serverUrl) + "/api/auth/kiosk/scan";
      http.begin(regUrl);
      http.addHeader("Content-Type", "application/json");

      // Hardware encoded Kiosk ID. This must match the Web frontend.
      String jsonPayload =
          "{\"kiosk_id\":\"kiosk_demo_01\",\"uid\":\"" + uid + "\"}";

      Serial.print("Sending Registration Payload: ");
      Serial.println(jsonPayload);

      int regCode = http.POST(jsonPayload);

      if (regCode == 200) {
        Serial.println("Registration Successful! Backend matched Mobile Form.");
        http.end();

        // Grant access on first registration (optional, can be false if you
        // just want them to register and not open yet).
        return true;
      } else {
        Serial.printf("Registration Failed: Code %d\n", regCode);
      }
      http.end();
    }

    return false; // Deny if all flows fail
  }

  // Fallback for offline testing - Allow specific mock UID or Always Allow
  Serial.println("Offline Mode: Mock Authorization Allowed.");
  delay(500);
  return true;
}

void unlockCabinet() {
  digitalWrite(LOCK_PIN, HIGH);
  Serial.println("[LOCK] Unlocked.");
}

void lockCabinet() {
  digitalWrite(LOCK_PIN, LOW);
  Serial.println("[LOCK] Locked.");
}

void checkItemScan() {
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  String newItemId = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10)
      newItemId += "0";
    newItemId += String(mfrc522.uid.uidByte[i], HEX);
  }
  newItemId.toUpperCase();

  // Check if item already scanned in this session
  bool duplicate = false;
  for (const String &item : scannedItems) {
    if (item == newItemId) {
      duplicate = true;
      break;
    }
  }

  if (duplicate) {
    Serial.println("Item already scanned: " + newItemId);
  } else {
    scannedItems.push_back(newItemId);
    Serial.print("Item Added: ");
    Serial.println(newItemId);
    Serial.print("Total Items: ");
    Serial.println(scannedItems.size());
  }

  mfrc522.PICC_HaltA(); // Stop reading current card

  // Optional: Beep or LED indication here
}

// Updated Door Logic
void checkCabinetClose() {
  // Check if Pin 4 is LOW (Grounded/Closed)
  int doorState = digitalRead(TOUCH_PIN);

  if (doorState == LOW) { // Closed
    Serial.println("Door Closed Detected (Pin 4 LOW). Locking...");
    currentState = REPORTING;
  }
}

void sendTransactionData(String user, String item) {
  Serial.println("--- Reporting Transaction ---");
  Serial.print("User: ");
  Serial.println(user);
  Serial.print("Item: ");
  Serial.println(item.length() > 0 ? item : "None");

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(serverUrl) + "/api/transactions"); // Adjust endpoint
    http.addHeader("Content-Type", "application/json");

    // JSON Payload
    String json =
        "{\"user_uid\": \"" + user + "\", \"item_uid\": \"" + item + "\"}";

    int httpResponseCode = http.POST(json);

    if (httpResponseCode > 0) {
      Serial.print("Server Response: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error sending: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("(Offline Mode: Data not sent)");
  }
}
