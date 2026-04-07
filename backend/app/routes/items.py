from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.item import (
    EnrollJobAccepted,
    EnrollJobStatus,
    ItemOut,
    PaginatedItems,
    UpdateItemQuantityRequest,
)
from app.services.auth_service import require_admin
from app.services.enroll_job_store import create_job, get_job, submit_job
from app.services.item_enroll_service import create_item_record
from app.services.items_service import get_active_items, update_item_quantity

router = APIRouter(prefix="/api/items", tags=["Items"])


@router.get("/", response_model=PaginatedItems)
def list_active_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_active_items(db, page, page_size)


@router.patch(
    "/{item_id}/quantity",
    response_model=ItemOut,
    dependencies=[Depends(require_admin)],
)
def adjust_item_quantity(
    item_id: int,
    body: UpdateItemQuantityRequest,
    db: Session = Depends(get_db),
):
    try:
        return update_item_quantity(db, item_id, body.delta)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/enroll",
    response_model=EnrollJobAccepted,
    status_code=202,
    dependencies=[Depends(require_admin)],
)
async def enroll_item_route(
    name: str = Form(...),
    quantity: int = Form(..., ge=0),
    video: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Start a background enrollment job.

    1. Creates the Item row immediately (fast DB write).
    2. Queues the heavy ML pipeline in a background thread.
    3. Returns **202 Accepted** with a ``job_id`` the frontend can poll.

    Poll ``GET /api/items/enroll/jobs/{job_id}`` until ``status`` is
    ``"done"`` or ``"failed"``.
    """
    video_bytes = await video.read()
    if not video_bytes:
        raise HTTPException(status_code=400, detail="video file is empty")

    # Synchronous part — create the DB record now so the item is visible
    # in the list immediately (status will show "processing").
    item = create_item_record(db, name=name, quantity=quantity)

    job_id = create_job(item_id=item.id, name=item.name, quantity=item.quantity)
    submit_job(job_id, video_bytes)

    return JSONResponse(
        status_code=202,
        content=EnrollJobAccepted(
            job_id=job_id,
            status="pending",
            item_id=item.id,
        ).model_dump(),
    )


@router.get(
    "/enroll/jobs/{job_id}",
    response_model=EnrollJobStatus,
    dependencies=[Depends(require_admin)],
)
def get_enroll_job_status(job_id: str):
    """Poll the status of a background enrollment job.

    Possible ``status`` values:

    * ``pending``  — queued, not yet started
    * ``running``  — ML pipeline is processing the video
    * ``done``     — complete; ``accepted_count``, ``image``, etc. are populated
    * ``failed``   — pipeline error; ``error`` field contains the message
    """
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")
    return EnrollJobStatus(**job)
