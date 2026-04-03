/*
 * cabinet_firmware.ino
 *
 * ESP32 firmware for cabinet NFC reader.
 *
 * Flow:
 *   1. Scan NFC card via I2C (PN532 v3: SDA=17, SCL=16)
 *   2. Publish card_id to  cabinet/access/request
 *   3. Subscribe to  cabinet/access/response
 *   4. If backend responds, transition to OPENED state (LED on)
 *   5. Wait for magnetic contact switch (door closed) → publish door/closed
 *   6. Transition back to CLOSED state (NFC enabled again)
 *
 * Libraries (install via Arduino Library Manager):
 *   - PubSubClient   by Nick O'Leary
 *   - ArduinoJson    by Benoit Blanchon
 *   - Adafruit PN532 by Adafruit
 */

#include <WiFi.h>
#include <Wire.h>
#include <ArduinoOTA.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Adafruit_PN532.h>
#include "mbedtls/md.h"

// ======================== CONFIG ========================
// WiFi
const char* WIFI_SSID     = "αιεχ Iphone";
const char* WIFI_PASSWORD = "Gne31@y13hA";

// MQTT broker
const char* MQTT_HOST     = "interchange.proxy.rlwy.net";
const int   MQTT_PORT     = 12264;
const char* MQTT_USER     = "admin";
const char* JWT_SECRET    = "ij11kndivmplh2l9e3rmi5hrpteqbvvr";

// MQTT topics (must match backend MQTT_SUBSCRIBE_TOPICS base)
const char* TOPIC_PUB_OPEN = "cabinet/access/request";
const char* TOPIC_SUB_RESULT = "cabinet/access/response";
const char* TOPIC_PUB_DOOR_CLOSED = "cabinet/door/closed";         // IoT → Backend: door closed by magnet
const char* TOPIC_PUB_CAPTURE = "cabinet/camera/capture";         // IoT → ESP-CAM: trigger photo
const char* TOPIC_SUB_REGISTER = "cabinet/card/register";         // Backend → IoT: enter register mode
const char* TOPIC_PUB_REGISTER_SCAN = "cabinet/card/scanned"; // IoT → Backend: scanned card during register
const char* TOPIC_SUB_REGISTER_RESULT = "cabinet/card/registered"; // Backend → IoT: confirmation

// ======================== PINS ==========================
#define LED_PIN     2       // Built-in LED (green = open mode)
#define LED_REG_PIN 4       // Registration mode LED (yellow — change pin as needed)
#define DOOR_SWITCH_PIN 25  // Magnetic contact switch (LOW = closed, HIGH = open)
#define PN532_SDA   17      // I2C SDA
#define PN532_SCL   16      // I2C SCL
#define SOLENOID_LOCK_PIN 26

// ======================== OBJECTS ========================
// I2C constructor: (irq, reset) — use -1 for polling without IRQ/RESET
Adafruit_PN532 nfc(-1, -1);

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

// ======================== STATE =========================
enum NfcMode { MODE_OPEN, MODE_REGISTER };
NfcMode nfcMode = MODE_OPEN;

enum CabinetState { CABINET_CLOSED, CABINET_OPENED };
CabinetState cabinetState = CABINET_CLOSED;
int currentSessionId = -1;

bool ledActive = false;
unsigned long ledOnTime = 0;
const unsigned long LED_DURATION = 3000;  // LED on for 3 seconds

// Registration mode state
unsigned long registerModeStart = 0;
const unsigned long REGISTER_TIMEOUT = 10000; // 10 seconds to scan card
int registerUserId = -1;

// WiFi reconnect state
unsigned long lastWifiAttempt = 0;
const unsigned long WIFI_RETRY_INTERVAL = 5000; // 5 seconds between retries
bool otaInitialized = false;

// ======================== JWT GENERATION =================
// Base64url encode (no padding)
String base64url(const uint8_t* data, size_t len) {
    const char* table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    String out;
    out.reserve((len * 4) / 3 + 4);
    for (size_t i = 0; i < len; i += 3) {
        uint32_t n = ((uint32_t)data[i]) << 16;
        if (i + 1 < len) n |= ((uint32_t)data[i + 1]) << 8;
        if (i + 2 < len) n |= data[i + 2];
        out += table[(n >> 18) & 0x3F];
        out += table[(n >> 12) & 0x3F];
        out += (i + 1 < len) ? table[(n >> 6) & 0x3F] : '\0';
        out += (i + 2 < len) ? table[n & 0x3F] : '\0';
    }
    // Remove trailing nulls and convert to url-safe
    while (out.length() > 0 && out.charAt(out.length() - 1) == '\0') {
        out.remove(out.length() - 1);
    }
    out.replace('+', '-');
    out.replace('/', '_');
    return out;
}

String base64url(const String& str) {
    return base64url((const uint8_t*)str.c_str(), str.length());
}

// HMAC-SHA256 using mbedtls (built into ESP32)
String hmacSHA256(const String& message, const char* secret) {
    uint8_t hash[32];
    mbedtls_md_context_t ctx;
    mbedtls_md_init(&ctx);
    mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 1);
    mbedtls_md_hmac_starts(&ctx, (const uint8_t*)secret, strlen(secret));
    mbedtls_md_hmac_update(&ctx, (const uint8_t*)message.c_str(), message.length());
    mbedtls_md_hmac_finish(&ctx, hash);
    mbedtls_md_free(&ctx);
    return base64url(hash, 32);
}

String generateMqttJWT() {
    // Header
    String header = base64url("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");

    // Payload — mosquitto-jwt plugin requires "subs" and "publ" arrays
    // Subscribe to: access/response, card/register, card/registered
    // Publish to: access/request, card/scanned
    String payload = "{\"subs\":[\"" + String(TOPIC_SUB_RESULT)
        + "\",\"" + String(TOPIC_SUB_REGISTER)
        + "\",\"" + String(TOPIC_SUB_REGISTER_RESULT)
        + "\"],\"publ\":[\"" + String(TOPIC_PUB_OPEN)
        + "\",\"" + String(TOPIC_PUB_REGISTER_SCAN)
        + "\",\"" + String(TOPIC_PUB_DOOR_CLOSED)
        + "\",\"" + String(TOPIC_PUB_CAPTURE) + "\"]}";
    String encodedPayload = base64url(payload);

    // Signature
    String toSign = header + "." + encodedPayload;
    String signature = hmacSHA256(toSign, JWT_SECRET);

    return toSign + "." + signature;
}

// ======================== MQTT CALLBACK =================
void onMessage(const char* topic, byte* payload, unsigned int length) {
    String message;
    message.reserve(length);
    for (unsigned int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    Serial.print("[MQTT] Received on ");
    Serial.print(topic);
    Serial.print(": ");
    Serial.println(message);

    String t = String(topic);

    if (t == TOPIC_SUB_RESULT) {
        // Backend confirmed open-cabinet — light up LED
        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, message);
        if (err) return;

        if (doc.containsKey("session_id")) {
            currentSessionId = doc["session_id"].as<int>();
            cabinetState = CABINET_OPENED;
            Serial.print("[CABINET] Opened — session #");
            Serial.println(currentSessionId);
            digitalWrite(LED_PIN, HIGH);
            ledActive = true;
            ledOnTime = millis();
        }
    }
    else if (t == TOPIC_SUB_REGISTER) {
        // Backend says: enter register mode
        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, message);
        if (err) return;

        registerUserId = doc["user_id"] | -1;
        nfcMode = MODE_REGISTER;
        registerModeStart = millis();

        // Turn on registration LED (yellow)
        digitalWrite(LED_REG_PIN, HIGH);
        digitalWrite(LED_PIN, LOW);

        Serial.print("[NFC] Entering REGISTER mode for user #");
        Serial.println(registerUserId);
    }
    else if (t == TOPIC_SUB_REGISTER_RESULT) {
        // Backend confirmed card registration
        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, message);
        if (err) return;

        const char* st = doc["status"] | "";
        if (strcmp(st, "ok") == 0) {
            Serial.println("[MQTT] Card registered successfully");
            // Blink green LED to confirm
            digitalWrite(LED_PIN, HIGH);
            ledActive = true;
            ledOnTime = millis();
        } else {
            Serial.print("[MQTT] Card registration failed: ");
            Serial.println(doc["message"] | "unknown");
        }
    }
}

// ======================== WIFI CONNECT ==================
void setupOTA() {
    ArduinoOTA.setHostname("cabinet-nfc");
    ArduinoOTA.setPassword("cabinet-ota-2026");
    ArduinoOTA.onStart([]() {
        Serial.println("[OTA] Update starting...");
    });
    ArduinoOTA.onEnd([]() {
        Serial.println("\n[OTA] Update complete — rebooting");
    });
    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        Serial.printf("[OTA] %u%%\r", progress * 100 / total);
    });
    ArduinoOTA.onError([](ota_error_t error) {
        Serial.printf("[OTA] Error[%u]: ", error);
        if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
        else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
        else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
        else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
        else if (error == OTA_END_ERROR) Serial.println("End Failed");
    });
    ArduinoOTA.begin();
    otaInitialized = true;
    Serial.println("[OTA] Ready");
}

bool wifiConnect() {
    Serial.print("[WiFi] Connecting to ");
    Serial.println(WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int timeout = 0;
    while (WiFi.status() != WL_CONNECTED && timeout < 20) {
        delay(500);
        Serial.print(".");
        timeout++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.print("\n[WiFi] Connected — IP: ");
        Serial.println(WiFi.localIP());
        return true;
    }

    Serial.println("\n[WiFi] Connection failed");
    return false;
}

// ======================== MQTT CONNECT ==================
void mqttConnect() {
    mqtt.setServer(MQTT_HOST, MQTT_PORT);
    mqtt.setBufferSize(512);
    mqtt.setCallback(onMessage);
    mqtt.setKeepAlive(30);

    String clientId = "cabinet-";
    clientId += String((uint32_t)ESP.getEfuseMac(), HEX);

    // Generate JWT for broker auth
    String token = generateMqttJWT();
    Serial.println("[MQTT] JWT generated for auth");

    Serial.print("[MQTT] Connecting to ");
    Serial.print(MQTT_HOST);
    Serial.print(":");
    Serial.println(MQTT_PORT);

    if (mqtt.connect(clientId.c_str(), MQTT_USER, token.c_str())) {
        Serial.println("[MQTT] Connected");
        mqtt.subscribe(TOPIC_SUB_RESULT);
        mqtt.subscribe(TOPIC_SUB_REGISTER);
        mqtt.subscribe(TOPIC_SUB_REGISTER_RESULT);
        Serial.println("[MQTT] Subscribed to all topics");
    } else {
        Serial.print("[MQTT] Failed, state: ");
        Serial.println(mqtt.state());
    }
}

// ======================== NFC ===========================
String readNFC() {
    uint8_t uid[7];
    uint8_t uidLength;

    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 100)) {
        String cardId = "";
        for (uint8_t i = 0; i < uidLength; i++) {
            if (uid[i] < 0x10) cardId += "0";
            cardId += String(uid[i], HEX);
        }
        cardId.toUpperCase();
        return cardId;
    }
    return "";
}

void publishOpenCabinet(const String& cardId) {
    JsonDocument doc;
    doc["card_id"] = cardId;

    char buf[128];
    serializeJson(doc, buf);

    mqtt.publish(TOPIC_PUB_OPEN, buf);
    Serial.print("[MQTT] Published → ");
    Serial.print(TOPIC_PUB_OPEN);
    Serial.print(" | ");
    Serial.println(buf);
}

// ======================== SETUP =========================
void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n--- Cabinet NFC Reader Starting ---");

    // LED
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
    pinMode(LED_REG_PIN, OUTPUT);
    digitalWrite(LED_REG_PIN, LOW);
    pinMode(DOOR_SWITCH_PIN, INPUT_PULLUP); // Magnetic switch: LOW = closed
    pinMode(SOLENOID_LOCK_PIN, OUTPUT);
    // digitalWrite(SOLENOID_LOCK_PIN, HIGH); // (LOW for test) Ensure solenoid lock is diseng

    // NFC (I2C) — set custom SDA/SCL pins before nfc.begin()
    Wire.begin(PN532_SDA, PN532_SCL);

    nfc.begin();
    uint32_t versiondata = nfc.getFirmwareVersion();
    if (!versiondata) {
        Serial.println("[NFC] PN532 not found — check wiring (SDA=17, SCL=16)");
    } else {
        Serial.print("[NFC] Found PN532 firmware v");
        Serial.print((versiondata >> 16) & 0xFF);
        Serial.print(".");
        Serial.println((versiondata >> 8) & 0xFF);
        nfc.SAMConfig();
        Serial.println("[NFC] Ready");
    }

    // WiFi + OTA + MQTT
    WiFi.setAutoReconnect(true);
    WiFi.persistent(true);
    if (wifiConnect()) {
        setupOTA();
        mqttConnect();
    }
}

// ======================== LOOP ==========================
void loop() {
    // --- WiFi reconnect ---
    if (WiFi.status() != WL_CONNECTED) {
        if (millis() - lastWifiAttempt >= WIFI_RETRY_INTERVAL) {
            lastWifiAttempt = millis();
            if (wifiConnect()) {
                if (!otaInitialized) setupOTA();
                mqttConnect();
            }
        }
        return; // Skip everything else until WiFi is back
    }

    // Handle OTA
    ArduinoOTA.handle();

    // Keep MQTT alive
    if (!mqtt.connected()) {
        mqttConnect();
    }
    mqtt.loop();

    // Turn off LED after duration
    if (ledActive && (millis() - ledOnTime >= LED_DURATION)) {
        digitalWrite(LED_PIN, LOW);
        ledActive = false;
    }

    // --- DOOR SWITCH: detect close while OPENED ---
    if (cabinetState == CABINET_OPENED) {
        if (digitalRead(DOOR_SWITCH_PIN) == LOW) { // magnet engaged = door closed
            Serial.println("[CABINET] Door closed (magnet detected)");

            // Trigger ESP32-CAM to capture → it will publish door/closed after image transfer
            JsonDocument capDoc;
            capDoc["session_id"] = currentSessionId;
            char capBuf[128];
            serializeJson(capDoc, capBuf);
            mqtt.publish(TOPIC_PUB_CAPTURE, capBuf);
            Serial.print("[MQTT] Published → ");
            Serial.print(TOPIC_PUB_CAPTURE);
            Serial.print(" | ");
            Serial.println(capBuf);

            cabinetState = CABINET_CLOSED;
            currentSessionId = -1;
            digitalWrite(LED_PIN, LOW);
            ledActive = false;
            // Beep solenoid lock to confirm close (adjust frequency/duration as needed)
            tone(SOLENOID_LOCK_PIN, 1000, 200); // Beep solenoid lock to confirm close (adjust as needed)
            delay(5000);
            noTone(SOLENOID_LOCK_PIN);
            // digitalWrite(SOLENOID_LOCK_PIN, LOW); // (TEST high first) Ensure solenoid lock is disengaged
            delay(1000); // debounce door
        }
        return; // Block NFC scans while cabinet is open
    }

    // --- REGISTER MODE ---
    if (nfcMode == MODE_REGISTER) {
        // Check timeout
        if (millis() - registerModeStart >= REGISTER_TIMEOUT) {
            Serial.println("[NFC] Register mode timed out");
            nfcMode = MODE_OPEN;
            registerUserId = -1;
            digitalWrite(LED_REG_PIN, LOW);
            return;
        }

        // Scan card for registration
        String cardId = readNFC();
        if (cardId.length() > 0) {
            Serial.print("[NFC] Register scan: ");
            Serial.println(cardId);

            // Publish scanned card to backend
            JsonDocument doc;
            doc["card_id"] = cardId;
            char buf[128];
            serializeJson(doc, buf);
            mqtt.publish(TOPIC_PUB_REGISTER_SCAN, buf);
            Serial.print("[MQTT] Published → ");
            Serial.println(TOPIC_PUB_REGISTER_SCAN);

            // Exit register mode
            nfcMode = MODE_OPEN;
            registerUserId = -1;
            digitalWrite(LED_REG_PIN, LOW);

            delay(2000); // debounce
        }
        return; // Skip normal open-cabinet scan while in register mode
    }

    // --- NORMAL MODE (open cabinet) ---
    String cardId = readNFC();
    if (cardId.length() > 0) {
        Serial.print("[NFC] Card scanned: ");
        Serial.println(cardId);
        publishOpenCabinet(cardId);

        // Debounce — wait before next scan
        delay(2000);
    }
}
