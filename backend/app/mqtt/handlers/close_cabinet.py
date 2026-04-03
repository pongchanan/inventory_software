import os
import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.open_session import OpenSession
from app.mqtt.handlers.image_store import pop_assembled_image


# Directory to save captured images
IMAGE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "captured_images")
os.makedirs(IMAGE_DIR, exist_ok=True)


def handle_close_cabinet(payload: dict, db: Session):
    """Assemble the JPEG image from MQTT chunks, save to disk, and close the OpenSession."""
    session_id = payload.get("session_id")
    if session_id is None:
        print("[close-cabinet] Missing session_id in payload")
        return

    # Assemble image from chunks collected by camera_image handler
    img_session_id, jpeg_data = pop_assembled_image()

    if jpeg_data is None:
        print(f"[close-cabinet] No assembled image available for session #{session_id}")
        # Still close the session, just without an image
        session = db.query(OpenSession).filter(OpenSession.id == session_id).first()
        if session:
            session.close_at = datetime.utcnow()
            db.commit()
            print(f"[close-cabinet] Session #{session.id} closed (no image)")
        return

    # Save JPEG to disk
    filename = f"session_{session_id}_{uuid.uuid4().hex[:8]}.jpg"
    filepath = os.path.join(IMAGE_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(jpeg_data)
    print(f"[close-cabinet] Saved image: {filepath} ({len(jpeg_data)} bytes)")

    # Update the session record
    session = db.query(OpenSession).filter(OpenSession.id == session_id).first()
    if not session:
        print(f"[close-cabinet] No OpenSession found with id {session_id}")
        return

    session.close_image_path = filepath
    session.close_at = datetime.utcnow()
    db.commit()
    print(f"[close-cabinet] Session #{session.id} closed with image {filepath}")
