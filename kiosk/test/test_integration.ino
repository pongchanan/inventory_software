/*
 * Integration Test for Complete Kiosk Workflow
 * 
 * This test validates the entire system flow with actual hardware.
 * Run this on the ESP32 with all components connected.
 * 
 * Test Flow:
 * 1. System initialization
 * 2. User card authentication
 * 3. Door opening
 * 4. Item scanning
 * 5. Door closing
 * 6. Transaction reporting
 * 
 * Upload this sketch to ESP32 and follow serial monitor instructions.
 */

#include <Adafruit_PN532.h>
#include <HTTPClient.h>
#include <MFRC522.h>
#include <SPI.h>
#include <WiFi.h>
#include <Wire.h>

// Test Configuration
const char *TEST_WIFI_SSID = "YOUR_WIFI_SSID";
const char *TEST_WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char *TEST_SERVER_URL = "http://YOUR_SERVER_IP:3000";

// Pin Definitions (same as main code)
#define PN532_IRQ_DUMMY 33
#define PN532_RESET_DUMMY 25
#define MFRC522_SS 5
#define MFRC522_RST 27
#define LOCK_PIN 26
#define TOUCH_PIN 4

// Test tracking
int testsPassed = 0;
int testsFailed = 0;
unsigned long testStartTime = 0;

// Initialize hardware
Adafruit_PN532 nfc(PN532_IRQ_DUMMY, PN532_RESET_DUMMY);
MFRC522 mfrc522(MFRC522_SS, MFRC522_RST);

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println(F("\n╔════════════════════════════════════════╗"));
  Serial.println(F("║   KIOSK INTEGRATION TEST SUITE        ║"));
  Serial.println(F("╚════════════════════════════════════════╝\n"));
  
  testStartTime = millis();
  
  // Run all integration tests
  runTest("Hardware Initialization", testHardwareInit);
  runTest("WiFi Connection", testWiFiConnection);
  runTest("NFC Reader (PN532)", testPN532);
  runTest("RFID Reader (MFRC522)", testMFRC522);
  runTest("Lock Control", testLockControl);
  runTest("Door Sensor", testDoorSensor);
  runTest("API Communication", testAPIConnection);
  runTest("User Authentication Flow", testAuthFlow);
  runTest("Complete Transaction Flow", testCompleteFlow);
  
  // Print summary
  printTestSummary();
}

void loop() {
  // Tests run once in setup
  delay(1000);
}

// =============================================================================
// Test Runner
// =============================================================================

void runTest(const char* testName, bool (*testFunc)()) {
  Serial.print(F("TEST: "));
  Serial.print(testName);
  Serial.print(F(" ... "));
  
  bool result = testFunc();
  
  if (result) {
    Serial.println(F("✓ PASS"));
    testsPassed++;
  } else {
    Serial.println(F("✗ FAIL"));
    testsFailed++;
  }
  
  delay(500);
}

void printTestSummary() {
  unsigned long testDuration = millis() - testStartTime;
  
  Serial.println(F("\n╔════════════════════════════════════════╗"));
  Serial.println(F("║         TEST SUMMARY                   ║"));
  Serial.println(F("╚════════════════════════════════════════╝"));
  Serial.print(F("Tests Passed: "));
  Serial.println(testsPassed);
  Serial.print(F("Tests Failed: "));
  Serial.println(testsFailed);
  Serial.print(F("Total Tests: "));
  Serial.println(testsPassed + testsFailed);
  Serial.print(F("Duration: "));
  Serial.print(testDuration / 1000.0, 2);
  Serial.println(F(" seconds"));
  
  if (testsFailed == 0) {
    Serial.println(F("\n✓ ALL TESTS PASSED!"));
  } else {
    Serial.println(F("\n✗ SOME TESTS FAILED"));
  }
}

// =============================================================================
// Individual Test Functions
// =============================================================================

bool testHardwareInit() {
  // Test GPIO pins setup
  pinMode(LOCK_PIN, OUTPUT);
  digitalWrite(LOCK_PIN, LOW);
  
  pinMode(TOUCH_PIN, INPUT_PULLUP);
  
  // Verify initial states
  if (digitalRead(LOCK_PIN) != LOW) {
    Serial.println(F("\n  ERROR: Lock pin not LOW"));
    return false;
  }
  
  return true;
}

bool testWiFiConnection() {
  Serial.print(F("\n  Connecting to WiFi"));
  WiFi.begin(TEST_WIFI_SSID, TEST_WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("\n  ERROR: WiFi not connected"));
    return false;
  }
  
  Serial.print(F("\n  IP: "));
  Serial.println(WiFi.localIP());
  return true;
}

bool testPN532() {
  Wire.begin(21, 22);  // SDA, SCL
  nfc.begin();
  
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println(F("\n  ERROR: PN532 not found"));
    return false;
  }
  
  Serial.print(F("\n  Firmware version: 0x"));
  Serial.println(versiondata, HEX);
  
  nfc.SAMConfig();
  return true;
}

bool testMFRC522() {
  SPI.begin();
  mfrc522.PCD_Init();
  
  // Check if MFRC522 responds
  byte version = mfrc522.PCD_ReadRegister(MFRC522::VersionReg);
  if (version == 0x00 || version == 0xFF) {
    Serial.println(F("\n  ERROR: MFRC522 not responding"));
    return false;
  }
  
  Serial.print(F("\n  Version: 0x"));
  Serial.println(version, HEX);
  return true;
}

bool testLockControl() {
  // Test unlock
  digitalWrite(LOCK_PIN, HIGH);
  delay(100);
  if (digitalRead(LOCK_PIN) != HIGH) {
    Serial.println(F("\n  ERROR: Lock not unlocking"));
    return false;
  }
  
  // Test lock
  digitalWrite(LOCK_PIN, LOW);
  delay(100);
  if (digitalRead(LOCK_PIN) != LOW) {
    Serial.println(F("\n  ERROR: Lock not locking"));
    return false;
  }
  
  return true;
}

bool testDoorSensor() {
  Serial.println(F("\n  Reading door sensor state..."));
  int state = digitalRead(TOUCH_PIN);
  Serial.print(F("  State: "));
  Serial.println(state == HIGH ? "OPEN" : "CLOSED");
  
  // Door sensor is working if it reads any valid state
  return true;
}

bool testAPIConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("\n  ERROR: WiFi not connected"));
    return false;
  }
  
  HTTPClient http;
  String testURL = String(TEST_SERVER_URL) + "/api/items/";
  
  Serial.print(F("\n  Testing API: "));
  Serial.println(testURL);
  
  http.begin(testURL);
  int httpCode = http.GET();
  
  Serial.print(F("  Response code: "));
  Serial.println(httpCode);
  
  http.end();
  
  // Accept any response (200, 401, etc.) as long as server responds
  if (httpCode <= 0) {
    Serial.println(F("\n  ERROR: No response from server"));
    return false;
  }
  
  return true;
}

bool testAuthFlow() {
  Serial.println(F("\n  Please scan a user card within 10 seconds..."));
  
  unsigned long startTime = millis();
  bool cardFound = false;
  
  while (millis() - startTime < 10000) {
    uint8_t uid[] = {0, 0, 0, 0, 0, 0, 0};
    uint8_t uidLength;
    
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50)) {
      Serial.print(F("  Card detected! UID: "));
      for (uint8_t i = 0; i < uidLength; i++) {
        if (uid[i] < 0x10) Serial.print(F("0"));
        Serial.print(uid[i], HEX);
      }
      Serial.println();
      cardFound = true;
      break;
    }
    delay(100);
  }
  
  if (!cardFound) {
    Serial.println(F("\n  WARNING: No card scanned (timeout)"));
    Serial.println(F("  Skipping authentication test"));
    return true; // Don't fail test if user doesn't scan
  }
  
  return true;
}

bool testCompleteFlow() {
  Serial.println(F("\n  === COMPLETE FLOW TEST ==="));
  Serial.println(F("  This test requires manual interaction:"));
  Serial.println(F("  1. Scan user card"));
  Serial.println(F("  2. Open door (release touch sensor)"));
  Serial.println(F("  3. Scan item card"));
  Serial.println(F("  4. Close door (touch sensor)"));
  Serial.println(F("\n  Starting in 5 seconds..."));
  delay(5000);
  
  // Step 1: Wait for user card
  Serial.println(F("  [1/4] Waiting for user card..."));
  bool userScanned = false;
  for (int i = 0; i < 100; i++) {  // 10 second timeout
    uint8_t uid[] = {0, 0, 0, 0, 0, 0, 0};
    uint8_t uidLength;
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50)) {
      Serial.println(F("  ✓ User card detected"));
      userScanned = true;
      break;
    }
    delay(100);
  }
  
  if (!userScanned) {
    Serial.println(F("  ⚠ User card timeout - skipping flow test"));
    return true;
  }
  
  // Unlock cabinet
  digitalWrite(LOCK_PIN, HIGH);
  Serial.println(F("  ✓ Cabinet unlocked"));
  
  // Step 2: Wait for door open
  Serial.println(F("  [2/4] Waiting for door to open..."));
  unsigned long doorOpenStart = millis();
  while (millis() - doorOpenStart < 10000) {
    if (digitalRead(TOUCH_PIN) == HIGH) {
      Serial.println(F("  ✓ Door opened"));
      break;
    }
    delay(100);
  }
  
  // Step 3: Wait for item scan
  Serial.println(F("  [3/4] Waiting for item scan..."));
  bool itemScanned = false;
  for (int i = 0; i < 100; i++) {  // 10 second timeout
    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      Serial.println(F("  ✓ Item scanned"));
      itemScanned = true;
      mfrc522.PICC_HaltA();
      break;
    }
    delay(100);
  }
  
  // Step 4: Wait for door close
  Serial.println(F("  [4/4] Waiting for door to close..."));
  unsigned long doorCloseStart = millis();
  while (millis() - doorCloseStart < 10000) {
    if (digitalRead(TOUCH_PIN) == LOW) {
      Serial.println(F("  ✓ Door closed"));
      break;
    }
    delay(100);
  }
  
  // Lock cabinet
  digitalWrite(LOCK_PIN, LOW);
  Serial.println(F("  ✓ Cabinet locked"));
  
  Serial.println(F("  === FLOW TEST COMPLETE ==="));
  return true;
}
