"""In-memory store for image chunks received via MQTT from ESP32-CAM.

Chunks arrive on  cabinet/camera/image/data/{chunk_index}  as raw bytes.
Metadata (start/done) arrives on  cabinet/camera/image  as JSON.
"""

import threading
from dataclasses import dataclass, field

_lock = threading.Lock()


@dataclass
class ImageTransfer:
    session_id: int
    total_size: int = 0
    total_chunks: int = 0
    chunks: dict[int, bytes] = field(default_factory=dict)


# Only one transfer at a time (single cabinet)
_current: ImageTransfer | None = None


def start_transfer(session_id: int, total_size: int, total_chunks: int):
    global _current
    with _lock:
        _current = ImageTransfer(
            session_id=session_id,
            total_size=total_size,
            total_chunks=total_chunks,
        )
    print(
        f"[image-store] Transfer started — session #{session_id}, {total_chunks} chunks, {total_size} bytes"
    )


def add_chunk(chunk_index: int, data: bytes):
    with _lock:
        if _current is None:
            print(f"[image-store] Chunk {chunk_index} received but no active transfer")
            return
        _current.chunks[chunk_index] = data
        print(
            f"[image-store] Chunk {chunk_index} stored ({len(data)} bytes, {len(_current.chunks)}/{_current.total_chunks})"
        )


def pop_assembled_image() -> tuple[int | None, bytes | None]:
    """Assemble and return (session_id, jpeg_bytes), then clear the store.

    Returns (None, None) if no transfer is active or chunks are incomplete.
    """
    global _current
    with _lock:
        if _current is None:
            return None, None

        if len(_current.chunks) < _current.total_chunks:
            print(
                f"[image-store] Incomplete: {len(_current.chunks)}/{_current.total_chunks} chunks"
            )
            return None, None

        # Assemble in order
        assembled = b""
        for i in range(_current.total_chunks):
            chunk = _current.chunks.get(i)
            if chunk is None:
                print(f"[image-store] Missing chunk {i} — cannot assemble")
                return None, None
            assembled += chunk

        session_id = _current.session_id
        _current = None
        print(
            f"[image-store] Assembled {len(assembled)} bytes for session #{session_id}"
        )
        return session_id, assembled
