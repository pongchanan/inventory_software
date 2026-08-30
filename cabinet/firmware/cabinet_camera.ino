/*
 * cabinet_camera.ino
 *
 * ESP32-CAM firmware for cabinet inventory imaging.
 *
 * Flow:
 *   1. Connect to WiFi + MQTT broker
 *   2. Subscribe to  cabinet/camera/capture
 *   3. When triggered (door closed), capture JPEG from camera
 *   4. POST raw JPEG to  POST /api/sessions/{id}/close-image  (HTTP)
 *      — backend uploads to S3 and closes the session
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
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "esp_camera.h"
#include "mbedtls/md.h"

// ======================== CONFIG ========================
// WiFi
const char* WIFI_SSID     = "OplorHotspot";
const char* WIFI_PASSWORD = "1212312121";

// MQTT broker
const char* MQTT_HOST     = "altaria.proxy.rlwy.net";
const int   MQTT_PORT     = 54004;
const char* MQTT_USER     = "admin";
const char* JWT_SECRET    = "1212312121";

// MQTT topics
const char* TOPIC_SUB_CAPTURE = "cabinet/camera/capture";  // Cabinet → CAM: take picture

// Backend HTTP endpoint (image upload + session close)
const char* BACKEND_URL = "https://backend-dev-1f43.up.railway.app";

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
    String payload = "{\"subs\":[\"" + String(TOPIC_SUB_CAPTURE) + "\"],\"publ\":[]}";
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
        config.frame_size  = FRAMESIZE_SVGA;  // 800x600 — safer for TLS upload (UXGA ~60KB crashes TLS heap)
        config.jpeg_quality = 10;
        config.fb_count    = 1;
        config.grab_mode   = CAMERA_GRAB_LATEST;
        Serial.println("[CAM] PSRAM found — using SVGA");
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

// ======================== CAPTURE & SEND VIA HTTP =======
void captureAndSend(int sessionId) {
    Serial.println("[CAM] Capturing image...");

    // Flash LED on early — AE needs time to re-calibrate from dark to lit scene
    digitalWrite(FLASH_LED_PIN, HIGH);
    delay(1500);  // 1.5 s warm-up: AE fully adjusts to flash illumination

    // Discard two stale frames (buffered before/during AE adjustment)
    for (int i = 0; i < 2; i++) {
        camera_fb_t* discard = esp_camera_fb_get();
        if (discard) esp_camera_fb_return(discard);
        delay(200);  // gap between discards
    }
    delay(400);  // final settle before the real capture

    // Capture with flash still ON → properly exposed frame
    camera_fb_t* fb = esp_camera_fb_get();
    delay(300);  // hold flash on briefly after shutter so frame is fully flushed
    digitalWrite(FLASH_LED_PIN, LOW);  // flash off after capture

    if (!fb) {
        Serial.println("[CAM] Capture failed");
        return;
    }

    Serial.printf("[CAM] Captured %u bytes (%dx%d)\n", fb->len, fb->width, fb->height);

    // Copy image out of camera DMA buffer into PSRAM, then free fb immediately.
    // This releases camera memory BEFORE TLS allocations (~70-100KB internal SRAM).
    size_t imgLen = fb->len;
    uint8_t* imgBuf = (uint8_t*) ps_malloc(imgLen);  // allocate in PSRAM
    if (!imgBuf) imgBuf = (uint8_t*) malloc(imgLen);  // fallback: internal heap
    if (!imgBuf) {
        Serial.println("[CAM] Not enough RAM for image copy");
        esp_camera_fb_return(fb);
        return;
    }
    memcpy(imgBuf, fb->buf, imgLen);
    esp_camera_fb_return(fb);  // free camera DMA NOW — before TLS stack is allocated

    // POST raw JPEG to backend — backend uploads to S3 and closes the session
    String url = String(BACKEND_URL) + "/api/sessions/" + sessionId + "/close-image";
    Serial.printf("[HTTP] POST %s\n", url.c_str());

    WiFiClientSecure secureClient;
    secureClient.setInsecure();  // Skip cert verification (ngrok / internal use)

    HTTPClient http;
    http.begin(secureClient, url);
    http.addHeader("Content-Type", "image/jpeg");
    http.setTimeout(15000);  // 15s — allow time for S3 upload

    int httpCode = http.POST(imgBuf, imgLen);
    free(imgBuf);

    if (httpCode == 200) {
        Serial.printf("[HTTP] Upload OK — session #%d closed\n", sessionId);
    } else {
        String body = http.getString();
        Serial.printf("[HTTP] Upload FAILED — code %d: %s\n", httpCode, body.c_str());
    }

    http.end();
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
    mqtt.setBufferSize(512);  // only small JSON control messages now
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
