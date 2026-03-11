/**
 * kiosk_mqtt.h
 *
 * MQTT topic definitions and communication layer for the kiosk.
 *
 * Topics the kiosk PUBLISHES to (backend subscribes via kiosk/#):
 *   TOPIC_PUB_OPEN_CABINET  – NFC UID scanned to request cabinet access
 *   TOPIC_PUB_REGISTER_CARD – RFID UID scanned to finalise a pending registration
 *   TOPIC_PUB_HEARTBEAT     – periodic liveness ping
 *
 * Topics the kiosk SUBSCRIBES to (backend publishes):
 *   TOPIC_SUB_RESPONSE      – JSON result of every action sent by the backend
 *
 * Usage
 * -----
 *   #include "kiosk_config.h"    // provides mqttHost, mqttPort, mqttUser, mqttPassword
 *   #include "kiosk_mqtt.h"
 *
 *   void setup() {
 *       mqtt_set_response_callback(onResponse);
 *       mqtt_connect();
 *   }
 *   void loop() {
 *       mqtt_loop();
 *   }
 *
 *   // called whenever kiosk/response arrives
 *   void onResponse(const String& payload) {
 *       // parse JSON payload and act accordingly
 *   }
 *
 * Dependencies (install via Arduino Library Manager):
 *   - PubSubClient  by Nick O'Leary
 *   - ArduinoJson   by Benoit Blanchon
 */

#ifndef KIOSK_MQTT_H
#define KIOSK_MQTT_H

#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFi.h>

// ---------------------------------------------------------------------------
// Topic strings
// ---------------------------------------------------------------------------

/** Kiosk → Backend: request access check for a scanned NFC UID */
#define TOPIC_PUB_OPEN_CABINET  "kiosk/open_cabinet"

/** Kiosk → Backend: submit scanned RFID UID to complete a pending registration */
#define TOPIC_PUB_REGISTER_CARD "kiosk/register_card"

/** Kiosk → Backend: heartbeat ping to confirm the kiosk is online */
#define TOPIC_PUB_HEARTBEAT     "kiosk/heartbeat"

/** Backend → Kiosk: JSON response for every action above */
#define TOPIC_SUB_RESPONSE      "kiosk/response"

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

static WiFiClient        _wifiClient;
static PubSubClient      _mqttClient(_wifiClient);
static void (*_responseCallback)(const String &payload) = nullptr;

// ---------------------------------------------------------------------------
// Internal: raw PubSubClient callback → routes to user callback
// ---------------------------------------------------------------------------

static void _mqtt_on_message(const char *topic, byte *payload, unsigned int length) {
    String message;
    message.reserve(length);
    for (unsigned int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    if (String(topic) == TOPIC_SUB_RESPONSE) {
        if (_responseCallback) {
            _responseCallback(message);
        }
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register a callback to receive backend responses on kiosk/response.
 * Must be called before mqtt_connect().
 *
 * The callback receives the raw JSON string.  Parse it yourself:
 *   JsonDocument doc;
 *   deserializeJson(doc, payload);
 *   const char* status = doc["status"];
 */
inline void mqtt_set_response_callback(void (*cb)(const String &payload)) {
    _responseCallback = cb;
}

/**
 * Connect to the MQTT broker and subscribe to kiosk/response.
 * Reads mqttHost, mqttPort, mqttUser, mqttPassword from kiosk_config.h.
 * Call once from setup() after WiFi is established.
 */
inline void mqtt_connect() {
    _mqttClient.setServer(mqttHost, mqttPort);
    _mqttClient.setCallback(_mqtt_on_message);
    _mqttClient.setKeepAlive(30);

    Serial.print("[MQTT] Connecting to ");
    Serial.print(mqttHost);
    Serial.print(":");
    Serial.println(mqttPort);

    // Unique client ID per board using MAC address
    String clientId = "kiosk-";
    clientId += String((uint32_t)ESP.getEfuseMac(), HEX);

    if (_mqttClient.connect(clientId.c_str(), mqttUser, mqttPassword)) {
        Serial.println("[MQTT] Connected.");
        _mqttClient.subscribe(TOPIC_SUB_RESPONSE);
        Serial.println("[MQTT] Subscribed to " TOPIC_SUB_RESPONSE);
    } else {
        Serial.print("[MQTT] Connection failed. State: ");
        Serial.println(_mqttClient.state());
    }
}

/**
 * Keep the MQTT connection alive and process incoming messages.
 * Must be called every iteration of loop().
 * Automatically reconnects if the connection drops.
 */
inline void mqtt_loop() {
    if (!_mqttClient.connected()) {
        Serial.println("[MQTT] Reconnecting...");
        mqtt_connect();
    }
    _mqttClient.loop();
}

// ---------------------------------------------------------------------------
// Publish helpers
// ---------------------------------------------------------------------------

/**
 * Publish kiosk/open_cabinet
 * Payload: { "rfid": "<NFC UID>" }
 *
 * @param rfid  NFC UID string read from the PN532 (e.g. "A1B2C3D4")
 */
inline void mqtt_publish_open_cabinet(const String &rfid) {
    JsonDocument doc;
    doc["rfid"] = rfid;

    char buf[128];
    serializeJson(doc, buf);

    _mqttClient.publish(TOPIC_PUB_OPEN_CABINET, buf);
    Serial.print("[MQTT] → " TOPIC_PUB_OPEN_CABINET " | ");
    Serial.println(buf);
}

/**
 * Publish kiosk/register_card
 * Payload: { "uid": "<RFID UID>" }
 *
 * @param uid  RFID UID string read from the MFRC522 (e.g. "1A2B3C4D")
 */
inline void mqtt_publish_register_card(const String &uid) {
    JsonDocument doc;
    doc["uid"] = uid;

    char buf[128];
    serializeJson(doc, buf);

    _mqttClient.publish(TOPIC_PUB_REGISTER_CARD, buf);
    Serial.print("[MQTT] → " TOPIC_PUB_REGISTER_CARD " | ");
    Serial.println(buf);
}

/**
 * Publish kiosk/heartbeat
 * Payload: { "status": "alive", "uptime_ms": <millis()> }
 */
inline void mqtt_publish_heartbeat() {
    JsonDocument doc;
    doc["status"]    = "alive";
    doc["uptime_ms"] = millis();

    char buf[128];
    serializeJson(doc, buf);

    _mqttClient.publish(TOPIC_PUB_HEARTBEAT, buf);
    Serial.print("[MQTT] → " TOPIC_PUB_HEARTBEAT " | ");
    Serial.println(buf);
}

#endif // KIOSK_MQTT_H
