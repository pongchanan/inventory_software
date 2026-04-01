/*
 * cabinet_firmware.ino
 *
 * ESP32 firmware for cabinet NFC reader.
 *
 * Flow:
 *   1. Scan NFC card via I2C (PN532 v3: SDA=17, SCL=16)
 *   2. Publish card_id to  inventory/iot/open-cabinet
 *   3. Subscribe to  inventory/iot/open-cabinet-result
 *   4. If backend responds, light up built-in LED
 *
 * Libraries (install via Arduino Library Manager):
 *   - PubSubClient   by Nick O'Leary
 *   - ArduinoJson    by Benoit Blanchon
 *   - Adafruit PN532 by Adafruit
 */

#include <WiFi.h>
#include <Wire.h>
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
const char* TOPIC_PUB_OPEN = "inventory/iot/open-cabinet";
const char* TOPIC_SUB_RESULT = "inventory/iot/open-cabinet-result";

// ======================== PINS ==========================
#define LED_PIN     2       // Built-in LED
#define PN532_SDA   17      // I2C SDA
#define PN532_SCL   16      // I2C SCL

// ======================== OBJECTS ========================
// I2C constructor: (irq, reset) — use -1 for polling without IRQ/RESET
Adafruit_PN532 nfc(-1, -1);

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

// ======================== STATE =========================
bool ledActive = false;
unsigned long ledOnTime = 0;
const unsigned long LED_DURATION = 3000;  // LED on for 3 seconds

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

    // Payload — mosquitto-jwt plugin requires "subs" and "publ" arrays (NOT sub/iat/exp)
    String payload = "{\"subs\":[\"" + String(TOPIC_SUB_RESULT) + "\"],\"publ\":[\"" + String(TOPIC_PUB_OPEN) + "\"]}";
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

    if (String(topic) == TOPIC_SUB_RESULT) {
        // Backend confirmed — light up LED
        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, message);
        if (err) {
            Serial.print("[MQTT] JSON parse error: ");
            Serial.println(err.c_str());
            return;
        }

        if (doc.containsKey("session_id")) {
            Serial.print("[MQTT] Session opened: #");
            Serial.println(doc["session_id"].as<int>());
            digitalWrite(LED_PIN, HIGH);
            ledActive = true;
            ledOnTime = millis();
        }
    }
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
        Serial.print("[MQTT] Subscribed to ");
        Serial.println(TOPIC_SUB_RESULT);
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

    // WiFi
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
        mqttConnect();
    } else {
        Serial.println("\n[WiFi] Connection failed");
    }
}

// ======================== LOOP ==========================
void loop() {
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

    // Scan NFC
    String cardId = readNFC();
    if (cardId.length() > 0) {
        Serial.print("[NFC] Card scanned: ");
        Serial.println(cardId);
        publishOpenCabinet(cardId);

        // Debounce — wait before next scan
        delay(2000);
    }
}
