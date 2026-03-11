"""
MQTT message handlers.

How it works:
  1. mqtt.py receives every message on the subscribed wildcard topic (e.g. kiosk/#)
  2. It calls route(topic, payload) here
  3. route() looks up the exact topic in TOPIC_HANDLERS and calls the matching function
  4. Each handler does whatever it needs to with the payload
  5. Call publish_response({...}) from anywhere to send a result back to the kiosk

To add a new topic:
  1. Write a handler function  handle_xyz(topic, payload)
  2. Add it to TOPIC_HANDLERS below
"""

from __future__ import annotations

import json
import logging
import os

logger = logging.getLogger(__name__)

# Topic the backend publishes responses to (read from .env)
_RESPONSE_TOPIC = (
    os.getenv("MQTT_PUBLISH_TOPICS", "kiosk/response").split(",")[0].strip()
)


# ---------------------------------------------------------------------------
# publish_response – call this from anywhere to send a result back
# ---------------------------------------------------------------------------


def publish_response(data: dict) -> None:
    """
    Publish a JSON response back to the response topic.

    Call this from any handler (or anywhere in the app) when you want to
    send a result back to the kiosk.

    Example:
        publish_response({"status": "ok", "message": "Done"})
        publish_response({"status": "error", "message": "Item not found"})
    """
    from app import mqtt  # deferred import to avoid circular dependency

    mqtt.publish(_RESPONSE_TOPIC, json.dumps(data))


# ---------------------------------------------------------------------------
# Topic handlers – add your logic here
# ---------------------------------------------------------------------------


def handle_scan(topic: str, payload: str) -> None:
    """Received when the kiosk scans an NFC + RFID tag."""
    logger.info("🔍 handle_scan | topic=%s | payload=%s", topic, payload)
    # TODO: add your logic here
    # data = json.loads(payload)
    # user_uid = data.get("user_uid")
    # item_uid = data.get("item_uid")
    # ... do work ...
    # publish_response({"status": "ok", "message": "Processed"})


def handle_heartbeat(topic: str, payload: str) -> None:
    """Received when the kiosk sends a heartbeat ping."""
    logger.info("💓 handle_heartbeat | topic=%s | payload=%s", topic, payload)
    # TODO: add your logic here


# ---------------------------------------------------------------------------
# TOPIC_HANDLERS – map exact topic (last segment) → handler function
#
# The key is matched against the last segment of the incoming topic so that
# both "kiosk/scan" and "kiosk/001/scan" map to the same handler.
#
# Add a new entry here when you add a new topic.
# ---------------------------------------------------------------------------

TOPIC_HANDLERS = {
    "scan": handle_scan,
    "heartbeat": handle_heartbeat,
}


# ---------------------------------------------------------------------------
# route – called by mqtt.py for every incoming message
# ---------------------------------------------------------------------------


def route(topic: str, payload: str) -> None:
    """
    Look up the incoming topic in TOPIC_HANDLERS and call the matching function.

    Uses the last segment of the topic for matching so that:
        kiosk/scan       → handle_scan
        kiosk/001/scan   → handle_scan   (per-kiosk variant)
        kiosk/heartbeat  → handle_heartbeat
    """
    last_segment = topic.rsplit("/", 1)[-1]
    handler = TOPIC_HANDLERS.get(last_segment)

    if handler:
        try:
            handler(topic, payload)
        except Exception:
            logger.exception("❌ Handler for '%s' raised an exception", topic)
    else:
        logger.debug("No handler for topic '%s'", topic)
