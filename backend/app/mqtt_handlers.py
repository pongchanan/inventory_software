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

from app.database import SessionLocal
from app.models.user import User

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


def open_cabinet(topic: str, payload: str) -> None:
    """Received when the kiosk scans an NFC + RFID tag."""
    logger.info("🔍 open_cabinet | topic=%s | payload=%s", topic, payload)

    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        logger.warning("open_cabinet: invalid JSON payload: %s", payload)
        publish_response({"status": "error", "message": "Invalid payload format"})
        return

    rfid = data.get("rfid")

    if not rfid:
        publish_response({"status": "error", "message": "Missing rfid in payload"})
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.uid == rfid).first()

        if user is None:
            logger.warning("open_cabinet: unknown rfid=%s", rfid)
            publish_response({"status": "error", "message": "User not found"})
            return

        if not user.authorized:
            logger.warning(
                "open_cabinet: unauthorized user rfid=%s name=%s", rfid, user.name
            )
            publish_response(
                {
                    "status": "error",
                    "message": "User is not authorized to access the cabinet",
                }
            )
            return

        # User is valid and authorized — proceed
        logger.info("open_cabinet: authorized user=%s rfid=%s", user.name, rfid)
        publish_response(
            {
                "status": "ok",
                "message": "Access granted",
                "user_id": user.id,
                "user_name": user.name,
                "user_email": user.email,
            }
        )

    finally:
        db.close()


def handle_heartbeat(topic: str, payload: str) -> None:
    """Received when the kiosk sends a heartbeat ping."""
    logger.info("💓 handle_heartbeat | topic=%s | payload=%s", topic, payload)
    # TODO: add your logic here


def register_card(topic: str, payload: str) -> None:
    """Received when the kiosk sends the scanned RFID UID to finalize a pending registration."""
    logger.info("🆕 register_card | topic=%s | payload=%s", topic, payload)

    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        logger.warning("register_card: invalid JSON payload: %s", payload)
        publish_response({"status": "error", "message": "Invalid payload format"})
        return

    kiosk_id = data.get("kiosk_id")
    uid = data.get("uid")

    if not kiosk_id or not uid:
        publish_response({"status": "error", "message": "Missing kiosk_id or uid"})
        return

    # Access the shared in-memory pending registration store from auth route
    from app.routes.auth import pending_registrations
    from app.auth import create_access_token
    import time

    pending_data = pending_registrations.get(kiosk_id)

    if pending_data is None:
        logger.warning(
            "register_card: no pending registration for kiosk_id=%s", kiosk_id
        )
        publish_response(
            {"status": "error", "message": "No pending registration for this kiosk"}
        )
        return

    if pending_data["expires_at"] < time.time():
        del pending_registrations[kiosk_id]
        logger.warning("register_card: registration expired for kiosk_id=%s", kiosk_id)
        publish_response({"status": "error", "message": "Registration session expired"})
        return

    if pending_data["status"] != "waiting":
        logger.warning(
            "register_card: registration not in waiting state for kiosk_id=%s", kiosk_id
        )
        publish_response(
            {"status": "error", "message": "Registration is no longer waiting for scan"}
        )
        return

    db = SessionLocal()
    try:
        # Check if UID is already registered
        existing_user = db.query(User).filter(User.uid == uid).first()
        if existing_user:
            logger.warning("register_card: uid=%s already registered", uid)
            publish_response(
                {"status": "error", "message": "This card is already registered"}
            )
            return

        # Check if email is already in use
        existing_email = (
            db.query(User).filter(User.email == pending_data["email"]).first()
        )
        if existing_email:
            logger.warning(
                "register_card: email=%s already in use", pending_data["email"]
            )
            publish_response(
                {"status": "error", "message": "This email is already in use"}
            )
            return

        # Create the user
        new_user = User(
            nfc_card_uid=uid,
            name=pending_data["name"],
            email=pending_data["email"],
            password_hash=pending_data["password_hash"],
            role="user",
            active=True,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Generate token so the frontend polling /kiosk/status can log the user in
        token = create_access_token(data={"sub": new_user.uid, "role": new_user.role})

        # Update the in-memory store — the frontend polling /kiosk/status will pick this up
        pending_registrations[kiosk_id]["status"] = "success"
        pending_registrations[kiosk_id]["user"] = new_user
        pending_registrations[kiosk_id]["token"] = token

        logger.info("register_card: registered user=%s uid=%s", new_user.name, uid)
        publish_response({"status": "ok", "message": "Registration complete"})

    finally:
        db.close()


# ---------------------------------------------------------------------------
# TOPIC_HANDLERS – map exact topic (last segment) → handler function
#
# The key is matched against the last segment of the incoming topic so that
# both "kiosk/scan" and "kiosk/001/scan" map to the same handler.
#
# Add a new entry here when you add a new topic.
# ---------------------------------------------------------------------------

TOPIC_HANDLERS = {
    "open_cabinet": open_cabinet,
    "register_card": register_card,
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
