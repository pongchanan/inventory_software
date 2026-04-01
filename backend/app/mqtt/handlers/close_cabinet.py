from sqlalchemy.orm import Session

from app.models.open_session import OpenSession
from app.mqtt.handlers.session_store import pop_active_session


def handle_close_cabinet(payload: dict, db: Session):
    """Receive the image from the camera, then update the OpenSession record with the image path."""
    image_path = payload.get("image_path")
    if not image_path:
        print("[close-cabinet] Missing image_path in payload")
        return

    session_id = pop_active_session()
    if session_id is None:
        print("[close-cabinet] No active session to close")
        return

    session = db.query(OpenSession).filter(OpenSession.id == session_id).first()
    if not session:
        print(f"[close-cabinet] No OpenSession found with id {session_id}")
        return

    session.close_image_path = image_path
    db.commit()
    print(f"[close-cabinet] Session #{session.id} closed with image {image_path}")
