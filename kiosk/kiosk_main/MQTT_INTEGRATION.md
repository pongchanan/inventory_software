# MQTT Integration Guide

Complete guide for setting up MQTT broker and backend integration for the Smart Kiosk system.

## 📡 Overview

The kiosk uses MQTT for real-time, bi-directional communication with your backend server. This enables:
- Instant user authorization
- Real-time item tracking
- Remote lock/unlock control
- Live status monitoring
- Emergency broadcasts

## 🏗️ Architecture

```
┌─────────────┐         MQTT Topics          ┌──────────────┐
│   Kiosk     │ ←──────────────────────────→ │    Broker    │
│   (ESP32)   │   Pub/Sub over WiFi          │ (Mosquitto)  │
└─────────────┘                               └──────┬───────┘
                                                     │
                                                     │ Subscribe
                                                     ▼
                                              ┌──────────────┐
                                              │   Backend    │
                                              │  (Node.js)   │
                                              └──────────────┘
```

## 📋 MQTT Topics Reference

### Kiosk Publishes (→ Server)

| Topic | Payload Example | Description | QoS |
|-------|----------------|-------------|-----|
| `kiosk/{id}/user/scan` | `{"user_uid":"04A1B2C3","timestamp":12345}` | User card scanned | 1 |
| `kiosk/{id}/item/scan` | `{"item_uid":"5A6B7C8D","timestamp":12345}` | Item tag scanned | 1 |
| `kiosk/{id}/transaction` | `{"user_uid":"04A1B2C3","item_uid":"5A6B7C8D"}` | Transaction record | 2 |
| `kiosk/{id}/status` | `{"status":"idle","timestamp":12345}` | Kiosk state change | 1 |
| `kiosk/{id}/door` | `{"state":"open","timestamp":12345}` | Door state change | 1 |

**Status Values:**
- `online` - Kiosk connected to MQTT
- `idle` - Waiting for user
- `waiting_door_open` - Unlocked, waiting for door
- `reporting` - Sending transactions
- `locked_remotely` - Locked by remote command
- `emergency_locked` - Locked by broadcast

**{id}** = Kiosk identifier from `kiosk_config.h` (e.g., "kiosk_demo_01")

### Kiosk Subscribes (← Server)

| Topic | Payload Example | Description |
|-------|----------------|-------------|
| `kiosk/{id}/command` | `{"command":"lock"}` | Remote control |
| `kiosk/{id}/auth/response` | `{"authorized":true}` | User authorization result |
| `kiosk/all/broadcast` | `{"emergency_lock":true}` | Emergency commands to all |

**Command Values:**
- `lock` - Lock the cabinet immediately
- `unlock` - Unlock the cabinet remotely

---

## 🖥️ Server Setup

### Step 1: Install MQTT Broker (Mosquitto)

#### On Linux (Ubuntu/Debian)

```bash
# Install Mosquitto broker and clients
sudo apt update
sudo apt install mosquitto mosquitto-clients

# Start the broker
sudo systemctl start mosquitto

# Enable auto-start on boot
sudo systemctl enable mosquitto

# Check status
sudo systemctl status mosquitto
```

#### On macOS

```bash
# Using Homebrew
brew install mosquitto

# Start broker
brew services start mosquitto
```

#### On Windows

1. Download installer from [mosquitto.org](https://mosquitto.org/download/)
2. Run installer
3. Start service: `net start mosquitto`

---

### Step 2: Configure Mosquitto

Edit `/etc/mosquitto/mosquitto.conf`:

```conf
# Basic configuration
listener 1883
allow_anonymous true

# For production, enable authentication:
# allow_anonymous false
# password_file /etc/mosquitto/passwd

# Logging
log_dest file /var/log/mosquitto/mosquitto.log
log_type all

# Persistence
persistence true
persistence_location /var/mosquitto/data/
```

**Restart after changes:**
```bash
sudo systemctl restart mosquitto
```

---

### Step 3: Test Broker

#### Terminal 1 - Subscribe to all kiosk topics:
```bash
mosquitto_sub -h localhost -t "kiosk/#" -v
```

#### Terminal 2 - Publish test message:
```bash
mosquitto_pub -h localhost -t "kiosk/test/status" -m '{"status":"testing"}'
```

You should see the message in Terminal 1.

---

## 🔧 Backend Integration (Node.js)

### Install MQTT Client Library

```bash
npm install mqtt
```

### Basic MQTT Client Example

Create `backend/mqtt_handler.js`:

```javascript
const mqtt = require('mqtt');

class KioskMQTTHandler {
  constructor(brokerUrl = 'mqtt://localhost:1883') {
    this.client = mqtt.connect(brokerUrl);
    this.setupHandlers();
  }

  setupHandlers() {
    this.client.on('connect', () => {
      console.log('✓ Connected to MQTT broker');
      
      // Subscribe to all kiosk events
      this.client.subscribe('kiosk/+/user/scan');
      this.client.subscribe('kiosk/+/item/scan');
      this.client.subscribe('kiosk/+/transaction');
      this.client.subscribe('kiosk/+/status');
      this.client.subscribe('kiosk/+/door');
      
      console.log('✓ Subscribed to kiosk topics');
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message.toString());
    });

    this.client.on('error', (error) => {
      console.error('MQTT Error:', error);
    });
  }

  async handleMessage(topic, payload) {
    try {
      const data = JSON.parse(payload);
      const parts = topic.split('/');
      const kioskId = parts[1];
      const eventType = parts[2];

      console.log(`📩 ${topic}:`, data);

      switch (eventType) {
        case 'user':
          if (parts[3] === 'scan') {
            await this.handleUserScan(kioskId, data);
          }
          break;

        case 'item':
          if (parts[3] === 'scan') {
            await this.handleItemScan(kioskId, data);
          }
          break;

        case 'transaction':
          await this.handleTransaction(kioskId, data);
          break;

        case 'status':
          await this.handleStatusUpdate(kioskId, data);
          break;

        case 'door':
          await this.handleDoorChange(kioskId, data);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  async handleUserScan(kioskId, data) {
    console.log(`User scan from ${kioskId}: ${data.user_uid}`);
    
    // Check database for user authorization
    const user = await this.checkUserInDatabase(data.user_uid);
    const authorized = user !== null && user.is_active;
    
    // Send authorization response
    const responseTopic = `kiosk/${kioskId}/auth/response`;
    const responsePayload = JSON.stringify({ 
      authorized,
      user_id: user?.id,
      timestamp: Date.now()
    });
    
    this.client.publish(responseTopic, responsePayload);
    console.log(`📤 Sent auth response: ${authorized}`);
  }

  async handleItemScan(kioskId, data) {
    console.log(`Item scan from ${kioskId}: ${data.item_uid}`);
    // Real-time item tracking (optional - store in cache/database)
  }

  async handleTransaction(kioskId, data) {
    console.log(`Transaction from ${kioskId}:`, data);
    
    // Save transaction to database
    await this.saveTransactionToDatabase({
      kiosk_id: kioskId,
      user_uid: data.user_uid,
      item_uid: data.item_uid,
      timestamp: new Date()
    });
  }

  async handleStatusUpdate(kioskId, data) {
    console.log(`Kiosk ${kioskId} status: ${data.status}`);
    // Update kiosk status in database/cache
  }

  async handleDoorChange(kioskId, data) {
    console.log(`Kiosk ${kioskId} door: ${data.state}`);
    // Track door open/close events
  }

  // Remote control methods
  lockKiosk(kioskId) {
    const topic = `kiosk/${kioskId}/command`;
    const payload = JSON.stringify({ command: 'lock' });
    this.client.publish(topic, payload);
    console.log(`🔒 Sent lock command to ${kioskId}`);
  }

  unlockKiosk(kioskId) {
    const topic = `kiosk/${kioskId}/command`;
    const payload = JSON.stringify({ command: 'unlock' });
    this.client.publish(topic, payload);
    console.log(`🔓 Sent unlock command to ${kioskId}`);
  }

  emergencyLockAll() {
    const topic = 'kiosk/all/broadcast';
    const payload = JSON.stringify({ emergency_lock: true });
    this.client.publish(topic, payload);
    console.log('⚠️ Emergency lock broadcast sent to all kiosks');
  }

  // Database integration examples (implement these)
  async checkUserInDatabase(userUid) {
    // TODO: Query your database
    // Example: return await User.findOne({ where: { uid: userUid } });
    return { id: 1, uid: userUid, is_active: true };
  }

  async saveTransactionToDatabase(transaction) {
    // TODO: Save to your database
    // Example: return await Transaction.create(transaction);
    console.log('💾 Transaction saved:', transaction);
  }
}

// Export singleton instance
module.exports = new KioskMQTTHandler();
```

### Use in Your Express App

In your `backend/main.py` or similar entry point:

```javascript
const express = require('express');
const mqttHandler = require('./mqtt_handler');

const app = express();

// Your existing routes...

// Example: Remote lock endpoint
app.post('/api/kiosks/:id/lock', (req, res) => {
  const kioskId = req.params.id;
  mqttHandler.lockKiosk(kioskId);
  res.json({ success: true, message: `Lock command sent to ${kioskId}` });
});

// Example: Emergency lockdown
app.post('/api/kiosks/emergency-lock', (req, res) => {
  mqttHandler.emergencyLockAll();
  res.json({ success: true, message: 'Emergency lock broadcast sent' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## 🧪 Testing MQTT Integration

### 1. Monitor All Traffic

```bash
# See all MQTT messages
mosquitto_sub -h YOUR_SERVER_IP -t "#" -v
```

### 2. Simulate User Authorization

```bash
# Simulate server sending auth response
mosquitto_pub -h YOUR_SERVER_IP \
  -t "kiosk/demo_01/auth/response" \
  -m '{"authorized":true}'
```

### 3. Simulate Remote Lock

```bash
# Send lock command
mosquitto_pub -h YOUR_SERVER_IP \
  -t "kiosk/demo_01/command" \
  -m '{"command":"lock"}'
```

### 4. Test Emergency Broadcast

```bash
# Emergency lock all kiosks
mosquitto_pub -h YOUR_SERVER_IP \
  -t "kiosk/all/broadcast" \
  -m '{"emergency_lock":true}'
```

---

## 🔐 Production Security

### Enable Authentication

```bash
# Create password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd admin

# Edit mosquitto.conf
echo "allow_anonymous false" | sudo tee -a /etc/mosquitto/mosquitto.conf
echo "password_file /etc/mosquitto/passwd" | sudo tee -a /etc/mosquitto/mosquitto.conf

# Restart
sudo systemctl restart mosquitto
```

### Use TLS/SSL

```conf
# In mosquitto.conf
listener 8883
cafile /etc/mosquitto/certs/ca.crt
certfile /etc/mosquitto/certs/server.crt
keyfile /etc/mosquitto/certs/server.key
```

### Update ESP32 Code

```cpp
// In mqtt_client.h, update begin() method to include auth
WiFiClientSecure wifiClient;  // Use secure client
wifiClient.setCACert(ca_cert);
mqttClient.setClient(wifiClient);
```

---

## 📊 MQTT Dashboard (Optional)

### Install MQTT Explorer (GUI)

Download from [mqtt-explorer.com](http://mqtt-explorer.com/)

**Features:**
- Visual topic tree
- Real-time message monitoring
- Publish test messages
- Connection management

**Connection Settings:**
- Host: Your server IP
- Port: 1883
- Protocol: mqtt://

---

## 🚀 Deployment Checklist

- [ ] Mosquitto broker installed and running
- [ ] Broker accessible from kiosk network (port 1883 open)
- [ ] Backend MQTT client connected
- [ ] Subscribed to all kiosk topics
- [ ] User authorization flow tested
- [ ] Transaction saving tested
- [ ] Remote lock/unlock tested
- [ ] Emergency broadcast tested
- [ ] Logs configured and monitored
- [ ] Authentication enabled (production)
- [ ] TLS/SSL configured (production)

---

## 📈 Monitoring and Logging

### View Mosquitto Logs

```bash
# Live log monitoring
sudo tail -f /var/log/mosquitto/mosquitto.log

# Or using journalctl
sudo journalctl -u mosquitto -f
```

### Monitor Connection Count

```bash
mosquitto_sub -h localhost -t '$SYS/broker/clients/connected' -v
```

### Check Message Rate

```bash
mosquitto_sub -h localhost -t '$SYS/broker/messages/received' -v
```

---

**Related Documentation:**
- [README.md](README.md) - Project overview
- [SETUP.md](SETUP.md) - Kiosk software setup
- [HARDWARE_WIRING.md](HARDWARE_WIRING.md) - Hardware connections
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
