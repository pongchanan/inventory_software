"""MQTT handlers for camera image transfer.

cabinet/camera/image          — JSON metadata (start / done events)
cabinet/camera/image/data/#   — raw JPEG chunks (binary)
"""

from sqlalchemy.orm import Session as DbSession

from app.mqtt.handlers.image_store import add_chunk, start_transfer


def handle_camera_image(payload: dict, db: DbSession):
    """Handle start/done metadata from ESP32-CAM."""
    event = payload.get("event")
    session_id = payload.get("session_id", -1)

    if event == "start":
        start_transfer(
            session_id=session_id,
            total_size=payload.get("total_size", 0),
            total_chunks=payload.get("total_chunks", 0),
        )
    elif event == "done":
        chunks_sent = payload.get("chunks_sent", 0)
        total_chunks = payload.get("total_chunks", 0)
        print(
            f"[camera-image] Transfer done — {chunks_sent}/{total_chunks} chunks for session #{session_id}"
        )
    elif event == "error":
        print(f"[camera-image] Transfer error for session #{session_id}")
    else:
        print(f"[camera-image] Unknown event: {event}")


def handle_camera_chunk(chunk_index: int, data: bytes):
    """Store a single raw JPEG chunk. Called directly from the MQTT dispatcher."""
    add_chunk(chunk_index, data)
