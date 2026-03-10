#include <WiFi.h>
#include <vector>

// --- Configuration ---
#include "kiosk_config.h"

// --- Communication Modules ---
#include "mqtt_client.h"

// --- Reader Modules ---
#include "nfc_reader.h"
#include "rfid_reader.h"

// --- Pins Definition ---

// 1. Solenoid Lock
#define LOCK_PIN 26

// 2. Door Sensor
#define TOUCH_PIN 4

// --- Objects ---
NFCReader nfcReader;
RFIDReader rfidReader;
MQTTClient mqttClient;

// --- State Machine ---
enum State {
  IDLE,
  VERIFYING_USER,
  CABINET_UNLOCKED,
  WAITING_FOR_DOOR_OPEN,
  WAITING_FOR_ACTION,
  REPORTING
};

State currentState = IDLE;
String currentUserId = "";
std::vector<String> scannedItems;
bool userAuthorized = false;
bool lastDoorState = false;

// Forward Declarations
void checkUserScan();
void unlockCabinet();
void lockCabinet();
void checkItemScan();
void checkCabinetClose();
void handleMQTTMessage(String topic, String payload);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- Smart Kiosk System Starting ---");

  pinMode(LOCK_PIN, OUTPUT);
  digitalWrite(LOCK_PIN, LOW);
  pinMode(TOUCH_PIN, INPUT_PULLUP);

  // WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    delay(500);
    Serial.print(".");
    timeout++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\nWiFi Connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Failed (Offline Mode).");
  }

  // Initialize NFC Reader (PN532)
  nfcReader.begin();

  // Initialize RFID Reader (MFRC522)
  rfidReader.begin();

  // Initialize MQTT Client
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n--- Initializing MQTT ---");
    mqttClient.begin(mqttBroker, mqttPort, kioskId, handleMQTTMessage);
    if (mqttClient.isConnected()) {
      Serial.println("✓ MQTT Connected!");
    } else {
      Serial.println("WARNING: MQTT connection failed. Will retry...");
    }
  }

  Serial.print("Door State: ");
  Serial.println(digitalRead(TOUCH_PIN) == LOW ? "CLOSED" : "OPEN");
  Serial.println("\n========================================");
  Serial.println("System Ready! Place a user NFC card...");
  Serial.println("========================================\n");
}

void loop() {
  // Maintain MQTT connection
  mqttClient.loop();

  // Monitor door state changes
  bool currentDoorState = (digitalRead(TOUCH_PIN) == HIGH);
  if (currentDoorState != lastDoorState) {
    mqttClient.publishDoorState(currentDoorState);
    lastDoorState = currentDoorState;
  }

  switch (currentState) {
  case IDLE:
    checkUserScan();
    break;

  case VERIFYING_USER:
    // Wait for MQTT response (handled in handleMQTTMessage)
    // After publishing user scan, server will send auth response
    if (userAuthorized) {
      Serial.println("Access Granted. Unlocking...");
      unlockCabinet();
      scannedItems.clear();
      currentState = WAITING_FOR_DOOR_OPEN;
      mqttClient.publishStatus("waiting_door_open");
      Serial.println("Waiting for door to open...");
      userAuthorized = false;
    }
    
    // Timeout after 5 seconds
    static unsigned long verifyStartTime = 0;
    if (currentState == VERIFYING_USER) {
      if (verifyStartTime == 0) verifyStartTime = millis();
      if (millis() - verifyStartTime > 5000) {
        Serial.println("Verification timeout. Access Denied.");
        currentState = IDLE;
        verifyStartTime = 0;
      }
    } else {
      verifyStartTime = 0;
    }
    break;

  case WAITING_FOR_DOOR_OPEN: {
    int doorState = digitalRead(TOUCH_PIN);
    if (doorState == HIGH) {
      Serial.println("Door Opened. Ready for item scan.");
      currentState = WAITING_FOR_ACTION;
    } else {
      static unsigned long lastPrint = 0;
      if (millis() - lastPrint > 1000) {
        lastPrint = millis();
        Serial.println("Waiting for door to open...");
      }
    }
    break;
  }

  case WAITING_FOR_ACTION:
    checkItemScan();
    checkCabinetClose();
    break;

  case REPORTING:
    Serial.println("--- Reporting Transactions ---");
    mqttClient.publishStatus("reporting");
    
    if (scannedItems.empty()) {
      mqttClient.publishTransaction(currentUserId, "");
    } else {
      for (const String &item : scannedItems) {
        mqttClient.publishTransaction(currentUserId, item);
        delay(100);
      }
    }
    
    Serial.print("Session Complete: User ");
    Serial.print(currentUserId);
    Serial.print(", Items: ");
    Serial.println(scannedItems.size());
    
    currentUserId = "";
    scannedItems.clear();
    lockCabinet();
    currentState = IDLE;
    mqttClient.publishStatus("idle");
    Serial.println("Session Ended. Idle.\n");
    break;
  }

  delay(50);
}

// --- Helper Functions ---

void checkUserScan() {
  String uid = nfcReader.readCard();
  
  if (uid.length() > 0) {
    currentUserId = uid;
    Serial.println("*** NFC User Card Detected! ***");
    Serial.print("UID: ");
    Serial.println(currentUserId);
    
    // Publish user scan via MQTT
    if (mqttClient.isConnected()) {
      mqttClient.publishUserScan(currentUserId);
      currentState = VERIFYING_USER;
    } else {
      Serial.println("MQTT Offline: Auto-granting access");
      userAuthorized = true;
      currentState = VERIFYING_USER;
    }
    delay(200);
  }
}

void handleMQTTMessage(String topic, String payload) {
  Serial.println("\n=== Handling MQTT Message ===");
  
  // Handle authentication response
  if (topic.indexOf("/auth/response") > 0 || topic.indexOf("/user/authorized") > 0) {
    // Parse JSON manually (simple approach)
    if (payload.indexOf("\"authorized\":true") > 0 || payload.indexOf("\"success\":true") > 0) {
      Serial.println("✓ User Authorized!");
      userAuthorized = true;
    } else {
      Serial.println("✗ User Denied!");
      currentState = IDLE;
    }
  }
  
  // Handle remote lock/unlock commands
  else if (topic.indexOf("/command") > 0) {
    if (payload.indexOf("\"lock\"") > 0) {
      Serial.println("Remote LOCK command received");
      lockCabinet();
      currentState = IDLE;
      mqttClient.publishStatus("locked_remotely");
    } else if (payload.indexOf("\"unlock\"") > 0) {
      Serial.println("Remote UNLOCK command received");
      unlockCabinet();
      mqttClient.publishStatus("unlocked_remotely");
    }
  }
  
  // Handle broadcast messages
  else if (topic.indexOf("/broadcast") > 0) {
    if (payload.indexOf("emergency_lock") > 0) {
      Serial.println("⚠️ EMERGENCY LOCK!");
      lockCabinet();
      currentState = IDLE;
      mqttClient.publishStatus("emergency_locked");
    }
  }
  
  Serial.println("=== End Message Handling ===\n");
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
  String newItemId = rfidReader.readCard();
  if (newItemId.length() == 0) return;

  bool duplicate = false;
  for (const String &item : scannedItems) {
    if (item == newItemId) { duplicate = true; break; }
  }

  if (duplicate) {
    Serial.println("Item already scanned: " + newItemId);
  } else {
    scannedItems.push_back(newItemId);
    Serial.print("✓ Item Added: ");
    Serial.println(newItemId);
    Serial.print("Total Items: ");
    Serial.println(scannedItems.size());
    
    // Publish item scan to MQTT
    mqttClient.publishItemScan(newItemId);
  }

  delay(200);
}

void checkCabinetClose() {
  if (digitalRead(TOUCH_PIN) == LOW) {
    Serial.println("Door Closed. Locking...");
    currentState = REPORTING;
  }
}
