"""
MQTT background service.

Connects to a Mosquitto broker over TCP using JWT authentication.
Runs paho-mqtt's network loop in a daemon thread — does not block FastAPI.

.env variables required:
    MOSQUITTO_TCP_HOST    – broker hostname
    MOSQUITTO_TCP_PORT    – broker TCP port
    MOSQUITTO_USER        – broker username
    JWT_SECRET            – secret to sign the JWT token
    MQTT_SUBSCRIBE_TOPICS – comma-separated topics to subscribe to  (e.g. kiosk/#)
    MQTT_PUBLISH_TOPICS   – comma-separated topics allowed to publish (e.g. kiosk/response)
"""

from __future__ import annotations

import logging
import os
import threading
from typing import Optional

import jwt
import paho.mqtt.client as mqtt

logger = logging.getLogger(__name__)

_client: Optional[mqtt.Client] = None
_connected = threading.Event()


# ---------------------------------------------------------------------------
# paho callbacks
# ---------------------------------------------------------------------------


def _on_connect(client: mqtt.Client, userdata, flags, rc: int) -> None:
    if rc == 0:
        logger.info("✅ MQTT connected")
        _connected.set()
        for topic in userdata.get("sub_topics", []):
            client.subscribe(topic, qos=0)
            logger.info("📡 Subscribed to: %s", topic)
    else:
        logger.error("❌ MQTT connection failed (rc=%s)", rc)


def _on_disconnect(client: mqtt.Client, userdata, rc: int) -> None:
    _connected.clear()
    if rc != 0:
        logger.warning("⚠️  MQTT disconnected unexpectedly (rc=%s) – will reconnect", rc)


def _on_message(client: mqtt.Client, userdata, msg: mqtt.MQTTMessage) -> None:
    try:
        payload = msg.payload.decode("utf-8")
    except Exception:
        payload = repr(msg.payload)

    logger.info("📬 MQTT received [%s]: %s", msg.topic, payload)

    # Route to handlers defined in mqtt_handlers.py
    from app import mqtt_handlers

    mqtt_handlers.route(msg.topic, payload)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def publish(topic: str, message: str, qos: int = 0) -> bool:
    """Publish a message to the broker. Returns True if queued successfully."""
    if _client is None:
        logger.error("MQTT client not initialised")
        return False
    if not _connected.is_set():
        logger.warning("MQTT not connected – message to '%s' may be queued", topic)
    result = _client.publish(topic, message, qos=qos)
    if result.rc == mqtt.MQTT_ERR_SUCCESS:
        return True
    logger.error("❌ Failed to publish to '%s' (rc=%s)", topic, result.rc)
    return False


# ---------------------------------------------------------------------------
# Lifecycle  (called from main.py lifespan)
# ---------------------------------------------------------------------------


def start() -> None:
    """Connect to the broker and start the background network loop."""
    global _client

    host = os.getenv("MOSQUITTO_TCP_HOST", "").strip()
    port_raw = os.getenv("MOSQUITTO_TCP_PORT", "").strip()
    user = os.getenv("MOSQUITTO_USER", "").strip()
    secret = os.getenv("JWT_SECRET", "").strip()
    raw_sub = os.getenv("MQTT_SUBSCRIBE_TOPICS", "").strip()
    raw_pub = os.getenv("MQTT_PUBLISH_TOPICS", "").strip()

    if not host:
        logger.info("ℹ️  MOSQUITTO_TCP_HOST not set – MQTT disabled")
        return

    try:
        port = int(port_raw)
    except ValueError:
        logger.error("❌ MQTT disabled – MOSQUITTO_TCP_PORT must be an integer")
        return

    sub_topics = [t.strip() for t in raw_sub.split(",") if t.strip()]
    pub_topics = [t.strip() for t in raw_pub.split(",") if t.strip()]

    # Build JWT token – mosquitto-jwt uses this as the password
    token = jwt.encode(
        {"subs": sub_topics, "publ": pub_topics},
        key=secret,
        algorithm="HS256",
    )

    # Create client (compatible with paho-mqtt 1.x and 2.x)
    try:
        _client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
            userdata={"sub_topics": sub_topics},
        )
    except AttributeError:
        _client = mqtt.Client(userdata={"sub_topics": sub_topics})  # type: ignore[call-arg]

    _client.username_pw_set(username=user, password=token)
    _client.on_connect = _on_connect
    _client.on_disconnect = _on_disconnect
    _client.on_message = _on_message
    _client.reconnect_delay_set(min_delay=1, max_delay=30)

    logger.info("🔗 Connecting to MQTT broker %s:%s …", host, port)
    try:
        _client.connect(host, port, keepalive=60)
    except Exception as exc:
        logger.error("❌ Initial connect failed: %s – will retry in background", exc)
        _client.connect_async(host, port, keepalive=60)

    _client.loop_start()
    logger.info("🚀 MQTT background loop started")


def stop() -> None:
    """Gracefully stop the MQTT client."""
    global _client
    if _client is None:
        return
    _client.loop_stop()
    _client.disconnect()
    _connected.clear()
    _client = None
    logger.info("🛑 MQTT stopped")
