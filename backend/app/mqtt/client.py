"""MQTT client — connects to broker, subscribes to the wildcard topic,
and dispatches incoming messages to the correct handler."""

import json
import os
import time

import jwt
import paho.mqtt.client as paho

from app.database import SessionLocal

_client: paho.Client | None = None


def _create_mqtt_jwt() -> str:
    """Create a JWT token for MQTT broker authentication.

    The mosquitto-jwt plugin requires ``subs`` (subscribe ACL) and
    ``publ`` (publish ACL) arrays — **not** the standard ``sub``/``iat``/``exp`` claims.
    """
    secret = os.environ.get("JWT_SECRET", "")
    algorithm = os.environ.get("JWT_ALGORITHM", "HS256")

    sub_topics = [
        t.strip()
        for t in os.environ.get("MQTT_SUBSCRIBE_TOPICS", "cabinet/#")
        .strip('"')
        .split(",")
    ]
    pub_topics = [
        t.strip()
        for t in os.environ.get("MQTT_PUBLISH_TOPICS", "cabinet/#")
        .strip('"')
        .split(",")
    ]

    payload = {"subs": sub_topics, "publ": pub_topics}
    return jwt.encode(payload, secret, algorithm=algorithm)


def _get_base_topic() -> str:
    """Return base topic stripped of trailing '/#'."""
    raw = os.environ.get("MQTT_SUBSCRIBE_TOPICS", "cabinet/#")
    return raw.strip('"').removesuffix("/#").removesuffix("#")


def _on_connect(client: paho.Client, userdata, flags, rc, properties=None):
    if rc == 0:
        topic = os.environ.get("MQTT_SUBSCRIBE_TOPICS", "cabinet/#").strip('"')
        client.subscribe(topic)
        print(f"[MQTT] Connected & subscribed to {topic}")
    else:
        print(f"[MQTT] Connection failed with code {rc}")


def _on_message(client: paho.Client, userdata, msg: paho.MQTTMessage):
    from app.mqtt.handlers import HANDLER_MAP

    base = _get_base_topic()
    # e.g. topic="cabinet/access/request" → sub_topic="access/request"
    sub_topic = msg.topic[len(base) :].lstrip("/")

    handler = HANDLER_MAP.get(sub_topic)
    if handler is None:
        print(f"[MQTT] No handler for sub-topic: {sub_topic} (full: {msg.topic})")
        return

    try:
        payload = json.loads(msg.payload.decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        payload = msg.payload.decode(errors="replace")

    db = SessionLocal()
    try:
        handler(payload, db)
    except Exception as exc:
        print(f"[MQTT] Handler error ({sub_topic}): {exc}")
        db.rollback()
    finally:
        db.close()


def start_mqtt() -> paho.Client | None:
    global _client

    host = os.environ.get("MOSQUITTO_TCP_HOST")
    port = os.environ.get("MOSQUITTO_TCP_PORT")
    if not host or not port:
        print("[MQTT] MOSQUITTO_TCP_HOST/PORT not set — skipping MQTT")
        return None

    _client = paho.Client(paho.CallbackAPIVersion.VERSION2)

    user = os.environ.get("MOSQUITTO_USER", "admin")
    token = _create_mqtt_jwt()
    _client.username_pw_set(user, token)

    _client.on_connect = _on_connect
    _client.on_message = _on_message

    _client.connect(host, int(port), keepalive=60)
    _client.loop_start()
    print(f"[MQTT] Client started → {host}:{port}")
    return _client


def stop_mqtt():
    global _client
    if _client:
        _client.loop_stop()
        _client.disconnect()
        print("[MQTT] Client stopped")
        _client = None


def publish(topic: str, payload: dict):
    """Publish a JSON message to the broker."""
    base = _get_base_topic()
    full_topic = f"{base}/{topic}"
    if _client and _client.is_connected():
        _client.publish(full_topic, json.dumps(payload))
