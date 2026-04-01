"""Handler for the 'open-cabinet' MQTT sub-topic.

Expected payload:
    { "card_id": "ABC123" }

Flow:
    1. Verify the card via users_service.verify_card
    2. If valid, create an OpenSession record
    3. Publish result back (optional future use)
"""

from sqlalchemy.orm import Session

from app.models.open_session import OpenSession
from app.mqtt.handlers.session_store import set_active_session
from app.services.users_service import verify_card


def handle_open_cabinet(payload: dict, db: Session):
    """For verify who is opening the cabinet, then create an OpenSession record."""
    card_id = payload.get("card_id")
    if not card_id:
        print("[open-cabinet] Missing card_id in payload")
        return

    try:
        user = verify_card(db, card_id)
    except Exception as exc:
        print(f"[open-cabinet] Card verification failed: {exc}")
        return

    session = OpenSession(open_by=user.id)
    db.add(session)
    db.commit()
    db.refresh(session)

    set_active_session(session.id)
    print(f"[open-cabinet] Session #{session.id} opened by user #{user.id}")
