/*
 * cabinet_camera.ino
 *
 * ESP32-CAM firmware for cabinet inventory imaging.
 *
 * Flow:
 *   1. Connect to WiFi + MQTT broker
 *   2. Subscribe to  cabinet/camera/capture
 *   3. When triggered (door closed), capture JPEG from camera
 *   4. Send JPEG via MQTT in chunks to  cabinet/camera/image/data
 *   5. Publish metadata to  cabinet/camera/image
 *
 * Hardware: AI-Thinker ESP32-CAM module
 *
 * Libraries (install via Arduino Library Manager):
 *   - PubSubClient   by Nick O'Leary
 *   - ArduinoJson    by Benoit Blanchon
 *
 * Board: ESP32 Wrover Module (or AI Thinker ESP32-CAM)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "esp_camera.h"
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

// MQTT topics
const char* TOPIC_SUB_CAPTURE      = "cabinet/camera/capture";      // Cabinet → CAM: take picture
const char* TOPIC_PUB_IMAGE        = "cabinet/camera/image";        // CAM → Backend: image metadata (start/done)
const char* TOPIC_PUB_IMAGE_DATA   = "cabinet/camera/image/data";   // CAM → Backend: raw JPEG chunks
const char* TOPIC_PUB_DOOR_CLOSED  = "cabinet/door/closed";         // CAM → Backend: door closed (after image sent)

// Chunk size for MQTT image transfer (4 KB per message)
const size_t MQTT_CHUNK_SIZE = 4096;

// ======================== CAMERA PINS (AI-Thinker ESP32-CAM) =====
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Built-in flash LED
#define FLASH_LED_PIN      4

// ======================== OBJECTS ========================
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

// ======================== STATE ==========================
bool captureRequested = false;
int  captureSessionId = -1;

unsigned long lastWifiAttempt = 0;
const unsigned long WIFI_RETRY_INTERVAL = 5000;

// ======================== JWT GENERATION =================
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
    String header = base64url("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
    String payload = "{\"subs\":[\"" + String(TOPIC_SUB_CAPTURE)
        + "\"],\"publ\":[\"" + String(TOPIC_PUB_IMAGE)
        + "\",\"" + String(TOPIC_PUB_IMAGE_DATA)
        + "\",\"" + String(TOPIC_PUB_DOOR_CLOSED) + "\"]}";
    String encodedPayload = base64url(payload);
    String toSign = header + "." + encodedPayload;
    String signature = hmacSHA256(toSign, JWT_SECRET);
    return toSign + "." + signature;
}

// ======================== CAMERA INIT ===================
void setupCamera() {
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer   = LEDC_TIMER_0;
    config.pin_d0       = Y2_GPIO_NUM;
    config.pin_d1       = Y3_GPIO_NUM;
    config.pin_d2       = Y4_GPIO_NUM;
    config.pin_d3       = Y5_GPIO_NUM;
    config.pin_d4       = Y6_GPIO_NUM;
    config.pin_d5       = Y7_GPIO_NUM;
    config.pin_d6       = Y8_GPIO_NUM;
    config.pin_d7       = Y9_GPIO_NUM;
    config.pin_xclk     = XCLK_GPIO_NUM;
    config.pin_pclk     = PCLK_GPIO_NUM;
    config.pin_vsync    = VSYNC_GPIO_NUM;
    config.pin_href     = HREF_GPIO_NUM;
    config.pin_sccb_sda = SIOD_GPIO_NUM;
    config.pin_sccb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn     = PWDN_GPIO_NUM;
    config.pin_reset    = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;

    // Use higher resolution if PSRAM is available
    if (psramFound()) {
        config.frame_size  = FRAMESIZE_UXGA;  // 1600x1200
        config.jpeg_quality = 10;
        config.fb_count    = 2;
        config.grab_mode   = CAMERA_GRAB_LATEST;
        Serial.println("[CAM] PSRAM found — using UXGA");
    } else {
        config.frame_size  = FRAMESIZE_VGA;   // 640x480
        config.jpeg_quality = 12;
        config.fb_count    = 1;
        config.grab_mode   = CAMERA_GRAB_WHEN_EMPTY;
        Serial.println("[CAM] No PSRAM — using VGA");
    }

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("[CAM] Init failed: 0x%x\n", err);
        ESP.restart();
    }

    // Adjust sensor settings for indoor cabinet lighting
    sensor_t* s = esp_camera_sensor_get();
    if (s) {
        s->set_brightness(s, 1);     // slightly brighter
        s->set_contrast(s, 1);
        s->set_whitebal(s, 1);       // auto white balance
        s->set_awb_gain(s, 1);
        s->set_exposure_ctrl(s, 1);  // auto exposure
    }

    Serial.println("[CAM] Camera ready");
}

// ======================== CAPTURE & SEND VIA MQTT =======
void captureAndSend(int sessionId) {
    Serial.println("[CAM] Capturing image...");

    // Flash LED on briefly for illumination
    digitalWrite(FLASH_LED_PIN, HIGH);
    delay(150);

    // Discard first frame (often has auto-exposure artifacts)
    camera_fb_t* discard = esp_camera_fb_get();
    if (discard) esp_camera_fb_return(discard);
    delay(100);

    // Take the actual photo
    camera_fb_t* fb = esp_camera_fb_get();
    digitalWrite(FLASH_LED_PIN, LOW);

    if (!fb) {
        Serial.println("[CAM] Capture failed");
        return;
    }

    Serial.printf("[CAM] Captured %u bytes (%dx%d)\n", fb->len, fb->width, fb->height);

    int totalChunks = (fb->len + MQTT_CHUNK_SIZE - 1) / MQTT_CHUNK_SIZE;

    // 1) Publish START metadata
    {
        JsonDocument doc;
        doc["session_id"]   = sessionId;
        doc["event"]        = "start";
        doc["total_size"]   = fb->len;
        doc["total_chunks"] = totalChunks;
        doc["chunk_size"]   = MQTT_CHUNK_SIZE;
        doc["width"]        = fb->width;
        doc["height"]       = fb->height;
        char buf[256];
        serializeJson(doc, buf);
        mqtt.publish(TOPIC_PUB_IMAGE, buf);
        Serial.printf("[MQTT] Published START — %d chunks\n", totalChunks);
    }

    // 2) Send raw JPEG data in chunks
    size_t offset = 0;
    int chunkIndex = 0;
    bool sendOk = true;

    while (offset < fb->len && sendOk) {
        size_t remaining = fb->len - offset;
        size_t chunkLen  = (remaining < MQTT_CHUNK_SIZE) ? remaining : MQTT_CHUNK_SIZE;

        // Build topic with chunk index: cabinet/camera/image/data/{chunk}
        char chunkTopic[64];
        snprintf(chunkTopic, sizeof(chunkTopic), "%s/%d", TOPIC_PUB_IMAGE_DATA, chunkIndex);

        if (!mqtt.publish(chunkTopic, fb->buf + offset, chunkLen)) {
            Serial.printf("[MQTT] Chunk %d/%d send FAILED\n", chunkIndex, totalChunks);
            sendOk = false;
            break;
        }

        Serial.printf("[MQTT] Chunk %d/%d sent (%u bytes)\n", chunkIndex + 1, totalChunks, chunkLen);
        offset += chunkLen;
        chunkIndex++;

        // Keep MQTT alive between chunks
        mqtt.loop();
        delay(20);  // small delay to avoid overwhelming the broker
    }

    // 3) Publish DONE metadata
    {
        JsonDocument doc;
        doc["session_id"]   = sessionId;
        doc["event"]        = sendOk ? "done" : "error";
        doc["chunks_sent"]  = chunkIndex;
        doc["total_chunks"] = totalChunks;
        char buf[256];
        serializeJson(doc, buf);
        mqtt.publish(TOPIC_PUB_IMAGE, buf);
        Serial.printf("[MQTT] Published %s\n", sendOk ? "DONE" : "ERROR");
    }

    // 4) Publish door/closed to backend (image transfer complete)
    if (sendOk) {
        JsonDocument doc;
        doc["session_id"] = sessionId;
        char buf[128];
        serializeJson(doc, buf);
        mqtt.publish(TOPIC_PUB_DOOR_CLOSED, buf);
        Serial.print("[MQTT] Published → ");
        Serial.print(TOPIC_PUB_DOOR_CLOSED);
        Serial.print(" | ");
        Serial.println(buf);
    }

    esp_camera_fb_return(fb);
}

// ======================== MQTT CALLBACK =================
void onMessage(char* topic, byte* payload, unsigned int length) {
    String message;
    message.reserve(length);
    for (unsigned int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    Serial.printf("[MQTT] Received on %s: %s\n", topic, message.c_str());

    if (String(topic) == TOPIC_SUB_CAPTURE) {
        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, message);
        if (err) {
            Serial.println("[MQTT] JSON parse error");
            return;
        }
        captureSessionId = doc["session_id"] | -1;
        captureRequested = true;  // Handle in loop() to avoid blocking callback
    }
}
// ======================== WIFI ==========================
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
        Serial.printf("\n[WiFi] Connected — IP: %s\n", WiFi.localIP().toString().c_str());
        return true;
    }

    Serial.println("\n[WiFi] Connection failed");
    return false;
}

// ======================== MQTT CONNECT ==================
void mqttConnect() {
    mqtt.setServer(MQTT_HOST, MQTT_PORT);
    mqtt.setBufferSize(MQTT_CHUNK_SIZE + 128);  // buffer large enough for chunk + overhead
    mqtt.setCallback(onMessage);
    mqtt.setKeepAlive(30);

    String clientId = "espcam-";
    clientId += String((uint32_t)ESP.getEfuseMac(), HEX);

    String token = generateMqttJWT();
    Serial.println("[MQTT] JWT generated for auth");

    Serial.printf("[MQTT] Connecting to %s:%d\n", MQTT_HOST, MQTT_PORT);

    if (mqtt.connect(clientId.c_str(), MQTT_USER, token.c_str())) {
        Serial.println("[MQTT] Connected");
        mqtt.subscribe(TOPIC_SUB_CAPTURE);
        Serial.println("[MQTT] Subscribed to cabinet/camera/capture");
    } else {
        Serial.printf("[MQTT] Failed, state: %d\n", mqtt.state());
    }
}

// ======================== SETUP =========================
void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n--- Cabinet Camera (ESP32-CAM) Starting ---");

    // Flash LED
    pinMode(FLASH_LED_PIN, OUTPUT);
    digitalWrite(FLASH_LED_PIN, LOW);

    // Camera
    setupCamera();

    // WiFi + MQTT
    WiFi.setAutoReconnect(true);
    WiFi.persistent(true);
    if (wifiConnect()) {
        mqttConnect();
    }
}

// ======================== LOOP ==========================
void loop() {
    // WiFi reconnect
    if (WiFi.status() != WL_CONNECTED) {
        if (millis() - lastWifiAttempt >= WIFI_RETRY_INTERVAL) {
            lastWifiAttempt = millis();
            if (wifiConnect()) {
                mqttConnect();
            }
        }
        return;
    }

    // MQTT reconnect
    if (!mqtt.connected()) {
        mqttConnect();
    }
    mqtt.loop();

    // Handle capture request (set by MQTT callback)
    if (captureRequested) {
        captureRequested = false;
        captureAndSend(captureSessionId);
        captureSessionId = -1;
    }
}
