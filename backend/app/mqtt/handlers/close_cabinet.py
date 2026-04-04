from datetime import datetime

from sqlalchemy.orm import Session

from app.models.open_session import OpenSession
from app.mqtt.handlers.image_store import pop_assembled_image
from app.services.s3_storage import upload_image


def handle_close_cabinet(payload: dict, db: Session):
    """Assemble the JPEG image from MQTT chunks, upload to S3, and close the OpenSession."""
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

    # Upload JPEG to S3
    try:
        image_key = upload_image(jpeg_data, session_id)
    except Exception as exc:
        print(f"[close-cabinet] S3 upload failed: {exc}")
        image_key = None

    # Update the session record
    session = db.query(OpenSession).filter(OpenSession.id == session_id).first()
    if not session:
        print(f"[close-cabinet] No OpenSession found with id {session_id}")
        return

    if image_key:
        session.close_image_path = image_key
    session.close_at = datetime.utcnow()
    db.commit()
    print(f"[close-cabinet] Session #{session.id} closed with image key {image_key}")
