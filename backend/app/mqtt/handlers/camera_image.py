"""MQTT handler for camera image transfer.

All events arrive on  cabinet/camera/image  as JSON:
  - {"event": "start", "session_id": N, "total_size": ..., "total_chunks": ...}
  - {"event": "chunk", "index": N, "data": "<base64>"}
  - {"event": "done",  "session_id": N, "chunks_sent": ..., "total_chunks": ...}
"""

from sqlalchemy.orm import Session as DbSession

from app.mqtt.handlers.image_store import add_chunk, start_transfer


def handle_camera_image(payload: dict, db: DbSession):
    """Handle start/chunk/done events from ESP32-CAM."""
    event = payload.get("event")
    session_id = payload.get("session_id", -1)

    if event == "start":
        start_transfer(
            session_id=session_id,
            total_size=payload.get("total_size", 0),
            total_chunks=payload.get("total_chunks", 0),
        )
    elif event == "chunk":
        chunk_index = payload.get("index", -1)
        b64_data = payload.get("data", "")
        if chunk_index < 0 or not b64_data:
            print(f"[camera-image] Invalid chunk: index={chunk_index}")
            return
        add_chunk(chunk_index, b64_data)
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
