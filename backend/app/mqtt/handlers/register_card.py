"""Handler for the 'card/scanned' MQTT sub-topic.

Received when the IoT device scans a card during registration mode.

Expected payload:
    { "card_id": "A1B2C3D4" }

Flow:
    1. Look up the pending user_id from card_registration_store
    2. Check card_id is not already taken
    3. Update the user's card_id
    4. Publish result back to IoT
"""

from sqlalchemy.orm import Session

from app.models.user import User
from app.mqtt.handlers.card_registration_store import (
    get_pending_user,
    resolve_pending,
    clear_pending,
)
from app.mqtt.client import publish


def handle_register_card_scan(payload: dict, db: Session):
    card_id = payload.get("card_id")
    if not card_id:
        print("[card/scanned] Missing card_id in payload")
        publish("card/registered", {"status": "error", "message": "Missing card_id"})
        return

    user_id = get_pending_user()
    if user_id is None:
        print("[card/scanned] No pending registration")
        publish(
            "card/registered",
            {"status": "error", "message": "No pending registration"},
        )
        return

    # Check card not already taken
    existing = db.query(User).filter(User.card_id == card_id).first()
    if existing:
        print(f"[card/scanned] Card {card_id} already assigned to user #{existing.id}")
        clear_pending()
        publish(
            "card/registered",
            {"status": "error", "message": "Card already assigned"},
        )
        return

    # Update user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print(f"[card/scanned] User #{user_id} not found")
        clear_pending()
        publish("card/registered", {"status": "error", "message": "User not found"})
        return

    user.card_id = card_id
    db.commit()
    db.refresh(user)

    print(f"[card/scanned] Linked card {card_id} to user #{user.id}")
    publish(
        "card/registered",
        {
            "status": "ok",
            "user_id": user.id,
            "card_id": card_id,
        },
    )

    # Resolve the pending wait so the HTTP endpoint can return
    resolve_pending(card_id)
