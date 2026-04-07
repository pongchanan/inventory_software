"""In-memory job store for background item-enrollment jobs.

Design
------
* ``POST /api/items/enroll`` creates an Item row synchronously (fast), then
  calls :func:`submit_job` and returns ``202 Accepted`` with the ``job_id``.
* A dedicated :class:`~concurrent.futures.ThreadPoolExecutor` (1 worker) runs
  the heavy ML pipeline in the background so the uvicorn event-loop is never
  blocked.
* ``GET /api/items/enroll/jobs/{job_id}`` calls :func:`get_job` to poll status.

Job lifecycle: pending → running → done | failed
"""

from __future__ import annotations

import logging
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from app.database import SessionLocal
from app.services.item_enroll_service import run_enroll_pipeline

logger = logging.getLogger(__name__)

# ── in-process store ─────────────────────────────────────────────────────────
# key: job_id (uuid str)
# value: dict with status + result fields
_store: dict[str, dict[str, Any]] = {}
_lock = threading.Lock()

# One worker at a time: ML on video is CPU/RAM-heavy; running two concurrently
# on a small server would OOM.  Raise to 2 if your hardware allows it.
_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="enroll")


# ── public API ───────────────────────────────────────────────────────────────


def create_job(item_id: int, name: str, quantity: int) -> str:
    """Register a new job and return its ``job_id``.

    Call this *before* :func:`submit_job`.
    """
    job_id = str(uuid.uuid4())
    with _lock:
        _store[job_id] = {
            "job_id": job_id,
            "status": "pending",
            "item_id": item_id,
            "name": name,
            "quantity": quantity,
            "is_active": True,
            "image": None,
            "accepted_count": None,
            "rejected_count": None,
            "frames_sampled": None,
            "error": None,
        }
    return job_id


def submit_job(job_id: str, video_bytes: bytes) -> None:
    """Dispatch the ML pipeline to the background thread pool."""
    _executor.submit(_run_job, job_id, video_bytes)


def get_job(job_id: str) -> dict[str, Any] | None:
    """Return a snapshot of the job, or ``None`` if the ``job_id`` is unknown."""
    with _lock:
        entry = _store.get(job_id)
        return dict(entry) if entry is not None else None


# ── internal worker ──────────────────────────────────────────────────────────


def _run_job(job_id: str, video_bytes: bytes) -> None:
    """Execute the enrollment pipeline in a background thread.

    Creates its own DB session so the request-scoped session (already closed
    by the time this runs) is never touched.
    """
    with _lock:
        job = _store.get(job_id)
        if job is None:
            logger.warning("[enroll_job] job %s not found in store — aborting", job_id)
            return
        _store[job_id]["status"] = "running"

    item_id: int = job["item_id"]
    name: str = job["name"]

    db = SessionLocal()
    try:
        logger.info(
            "[enroll_job] %s — starting ML pipeline for item_id=%d", job_id, item_id
        )
        result = run_enroll_pipeline(
            db, item_id=item_id, name=name, video_bytes=video_bytes
        )
        with _lock:
            _store[job_id].update(
                {
                    "status": "done",
                    "image": result["images"][0] if result["images"] else None,
                    "accepted_count": result["accepted_count"],
                    "rejected_count": result["rejected_count"],
                    "frames_sampled": result["frames_sampled"],
                }
            )
        logger.info(
            "[enroll_job] %s — done. accepted=%d rejected=%d frames=%d",
            job_id,
            result["accepted_count"],
            result["rejected_count"],
            result["frames_sampled"],
        )
    except Exception as exc:
        logger.exception("[enroll_job] %s — pipeline failed: %s", job_id, exc)
        with _lock:
            _store[job_id].update({"status": "failed", "error": str(exc)})
    finally:
        db.close()
