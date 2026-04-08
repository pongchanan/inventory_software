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

from sqlalchemy import update as sa_update

from app.database import SessionLocal
from app.models.item import Item
from app.services.item_enroll_service import run_enroll_pipeline
from app.services.s3_storage import get_presigned_url

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
        # Persist success status.  Also populate image_path from the first
        # accepted frame when the admin did not upload an explicit cover image.
        update_vals: dict = {"enroll_status": "done"}
        first_frame_key: str | None = result["images"][0] if result["images"] else None
        current_path = db.query(Item.image_path).filter(Item.id == item_id).scalar()
        if current_path is None and first_frame_key:
            update_vals["image_path"] = first_frame_key
        db.execute(sa_update(Item).where(Item.id == item_id).values(**update_vals))
        db.commit()

        # Resolve image key → presigned URL for the in-memory store so the
        # poll response gives the frontend a ready-to-use URL.
        resolved_key = update_vals.get("image_path") or current_path or first_frame_key
        image_url = get_presigned_url(resolved_key) if resolved_key else None

        with _lock:
            _store[job_id].update(
                {
                    "status": "done",
                    "image": image_url,
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
        # Persist failure to DB so orphaned items are detectable after a restart.
        try:
            db.execute(
                sa_update(Item).where(Item.id == item_id).values(enroll_status="failed")
            )
            db.commit()
        except Exception:
            pass
        with _lock:
            _store[job_id].update({"status": "failed", "error": str(exc)})
    finally:
        db.close()
