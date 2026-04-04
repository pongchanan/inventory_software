from datetime import datetime

from sqlalchemy.orm import Session

from app.models.open_session import OpenSession


def handle_close_cabinet(payload: dict, db: Session):
    """Close the OpenSession when door/closed is received via MQTT.

    Image upload is handled separately by POST /api/sessions/{id}/close-image.
    This handler is a fallback in case the ESP32-CAM HTTP upload already closed
    the session, or for sessions without a camera.
    """
    session_id = payload.get("session_id")
    if session_id is None:
        print("[close-cabinet] Missing session_id in payload")
        return

    session = db.query(OpenSession).filter(OpenSession.id == session_id).first()
    if not session:
        print(f"[close-cabinet] No OpenSession found with id {session_id}")
        return

    if session.close_at is not None:
        print(
            f"[close-cabinet] Session #{session_id} already closed (image upload beat us)"
        )
        return

    session.close_at = datetime.utcnow()
    db.commit()
    print(f"[close-cabinet] Session #{session.id} closed (no image)")
