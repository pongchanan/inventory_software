#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include <WiFi.h>
#include <PubSubClient.h>

// Callback function type for incoming messages
typedef void (*MessageCallback)(String topic, String payload);

class MQTTClient {
private:
  WiFiClient wifiClient;
  PubSubClient mqttClient;
  String kioskId;
  MessageCallback callback;

  void reconnect() {
    int retries = 0;
    while (!mqttClient.connected() && retries < 3) {
      Serial.print("Connecting to MQTT broker...");
      
      if (mqttClient.connect(kioskId.c_str())) {
        Serial.println(" Connected!");
        
        // Subscribe to kiosk-specific commands
        String commandTopic = "kiosk/" + kioskId + "/command";
        mqttClient.subscribe(commandTopic.c_str());
        Serial.println("Subscribed to: " + commandTopic);
        
        // Subscribe to broadcast messages
        mqttClient.subscribe("kiosk/all/broadcast");
        Serial.println("Subscribed to: kiosk/all/broadcast");
        
        publishStatus("online");
      } else {
        Serial.print(" Failed, rc=");
        Serial.println(mqttClient.state());
        delay(2000);
        retries++;
      }
    }
  }

  static void messageHandler(char* topic, byte* payload, unsigned int length) {
    // This is a static wrapper - we'll handle the actual callback in the instance
  }

public:
  MQTTClient() : mqttClient(wifiClient), callback(nullptr) {}

  void begin(const char* broker, int port, String kiosk_id, MessageCallback cb) {
    kioskId = kiosk_id;
    callback = cb;
    
    mqttClient.setServer(broker, port);
    mqttClient.setCallback([this](char* topic, byte* payload, unsigned int length) {
      String topicStr = String(topic);
      String payloadStr = "";
      for (unsigned int i = 0; i < length; i++) {
        payloadStr += (char)payload[i];
      }
      
      Serial.println("📩 MQTT Message Received:");
      Serial.println("  Topic: " + topicStr);
      Serial.println("  Payload: " + payloadStr);
      
      if (callback) {
        callback(topicStr, payloadStr);
      }
    });
    
    reconnect();
  }

  void loop() {
    if (!mqttClient.connected()) {
      reconnect();
    }
    mqttClient.loop();
  }

  bool isConnected() {
    return mqttClient.connected();
  }

  // Publish user scan for verification
  bool publishUserScan(String userUid) {
    String topic = "kiosk/" + kioskId + "/user/scan";
    String payload = "{\"user_uid\":\"" + userUid + "\",\"timestamp\":" + String(millis()) + "}";
    
    Serial.println("📤 Publishing user scan: " + userUid);
    return mqttClient.publish(topic.c_str(), payload.c_str());
  }

  // Publish transaction data
  bool publishTransaction(String userUid, String itemUid) {
    String topic = "kiosk/" + kioskId + "/transaction";
    String payload = "{\"user_uid\":\"" + userUid + "\",\"item_uid\":\"" + itemUid + "\"}";
    
    Serial.println("📤 Publishing transaction");
    return mqttClient.publish(topic.c_str(), payload.c_str());
  }

  // Publish kiosk status
  bool publishStatus(String status) {
    String topic = "kiosk/" + kioskId + "/status";
    String payload = "{\"status\":\"" + status + "\",\"timestamp\":" + String(millis()) + "}";
    
    return mqttClient.publish(topic.c_str(), payload.c_str());
  }

  // Publish door state
  bool publishDoorState(bool isOpen) {
    String topic = "kiosk/" + kioskId + "/door";
    String payload = "{\"state\":\"" + String(isOpen ? "open" : "closed") + "\",\"timestamp\":" + String(millis()) + "}";
    
    return mqttClient.publish(topic.c_str(), payload.c_str());
  }

  // Publish item scan
  bool publishItemScan(String itemUid) {
    String topic = "kiosk/" + kioskId + "/item/scan";
    String payload = "{\"item_uid\":\"" + itemUid + "\",\"timestamp\":" + String(millis()) + "}";
    
    Serial.println("📤 Publishing item scan: " + itemUid);
    return mqttClient.publish(topic.c_str(), payload.c_str());
  }
};

#endif
