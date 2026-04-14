from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.item import (
    AiSampleOut,
    EnrollJobAccepted,
    EnrollJobStatus,
    ItemOut,
    PaginatedItems,
    UpdateItemQuantityRequest,
)
from app.services.auth_service import require_admin
from app.services.enroll_job_store import create_job, get_job, submit_job
from app.services.item_enroll_service import add_quantity_to_existing, create_item_record
from app.services.items_service import (
    delete_item_sample,
    get_active_items,
    get_admin_items,
    get_item_samples,
    item_to_out,
    toggle_item_active,
    update_item_image,
    update_item_quantity,
    upload_sample_image,
)

router = APIRouter(prefix="/api/items")


@router.get("/", response_model=PaginatedItems, tags=["General"])
def list_active_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, max_length=100),
    db: Session = Depends(get_db),
):
    return get_active_items(db, page, page_size, search=search)


@router.get("/admin", response_model=PaginatedItems, dependencies=[Depends(require_admin)], tags=["Admin API"])
def list_admin_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, max_length=100),
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
):
    return get_admin_items(db, page, page_size, search=search, is_active=is_active)


@router.patch(
    "/{item_id}/active",
    response_model=ItemOut,
    dependencies=[Depends(require_admin)],
    tags=["Admin API"],
)
def toggle_item_active_route(item_id: int, db: Session = Depends(get_db)):
    try:
        return toggle_item_active(db, item_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.patch(
    "/{item_id}/quantity",
    response_model=ItemOut,
    dependencies=[Depends(require_admin)],
    tags=["Admin API"],
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
    tags=["Admin API"],
)
async def enroll_item_route(
    name: str = Form(...),
    quantity: int = Form(..., ge=0),
    video: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
    item_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    """Start a background enrollment job.

    **New item** (``item_id`` omitted): ``video`` is required.
    Creates the Item row, then runs the ML pipeline.

    **Existing item** (``item_id`` provided): adds ``quantity`` to the
    existing item.  If a ``video`` is also provided the ML pipeline runs
    to add more sample data.  Cover image is optional for existing items.

    Poll ``GET /api/items/enroll/jobs/{job_id}`` until ``status`` is
    ``"done"`` or ``"failed"``.
    """
    # --- read uploaded files -------------------------------------------------
    video_bytes: bytes | None = None
    if video is not None:
        video_bytes = await video.read()
        if not video_bytes:
            video_bytes = None

    image_bytes: bytes | None = None
    image_content_type = "image/jpeg"
    if image is not None:
        image_bytes = await image.read()
        image_content_type = image.content_type or "image/jpeg"
        if not image_bytes:
            image_bytes = None

    # --- existing item path --------------------------------------------------
    if item_id is not None:
        item = add_quantity_to_existing(
            db,
            item_id=item_id,
            extra_quantity=quantity,
            image_bytes=image_bytes,
            image_content_type=image_content_type,
        )
        if item is None:
            raise HTTPException(status_code=404, detail="Item not found")

        # If a video was provided, run the ML pipeline for more samples
        if video_bytes:
            job_id = create_job(item_id=item.id, name=item.name, quantity=item.quantity)
            submit_job(job_id, video_bytes)
            return JSONResponse(
                status_code=202,
                content=EnrollJobAccepted(
                    job_id=job_id, status="pending", item_id=item.id,
                ).model_dump(),
            )

        # No video — just quantity bump, return immediately
        return JSONResponse(
            status_code=202,
            content=EnrollJobAccepted(
                job_id="", status="done", item_id=item.id,
            ).model_dump(),
        )

    # --- new item path -------------------------------------------------------
    if not video_bytes:
        raise HTTPException(status_code=400, detail="Video file is required for new items")

    item = create_item_record(
        db,
        name=name,
        quantity=quantity,
        image_bytes=image_bytes,
        image_content_type=image_content_type,
    )

    job_id = create_job(item_id=item.id, name=item.name, quantity=item.quantity)
    submit_job(job_id, video_bytes)

    return JSONResponse(
        status_code=202,
        content=EnrollJobAccepted(
            job_id=job_id, status="pending", item_id=item.id,
        ).model_dump(),
    )


@router.get(
    "/enroll/jobs/{job_id}",
    response_model=EnrollJobStatus,
    dependencies=[Depends(require_admin)],
    tags=["Admin API"],
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


@router.put(
    "/{item_id}/image",
    response_model=ItemOut,
    dependencies=[Depends(require_admin)],
    tags=["Admin API"],
)
async def upload_item_image_route(
    item_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Replace (or set) the cover image for an existing item.

    Uploads the provided image file to S3, stores the S3 object key in
    ``item.image_path``, and returns the updated item with a live presigned
    URL as the ``image`` field — ready to use as an ``<img src>``.
    """
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="image file is empty")
    content_type = image.content_type or "image/jpeg"
    try:
        return update_item_image(db, item_id, image_bytes, content_type)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ── AI sample management ────────────────────────────────────────────────

@router.get(
    "/{item_id}/samples",
    response_model=list[AiSampleOut],
    dependencies=[Depends(require_admin)],
    tags=["Admin API"],
)
def list_item_samples(item_id: int, db: Session = Depends(get_db)):
    try:
        return get_item_samples(db, item_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete(
    "/{item_id}/samples/{sample_id}",
    status_code=204,
    dependencies=[Depends(require_admin)],
    tags=["Admin API"],
)
def delete_item_sample_route(item_id: int, sample_id: int, db: Session = Depends(get_db)):
    try:
        delete_item_sample(db, item_id, sample_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post(
    "/{item_id}/samples",
    response_model=AiSampleOut,
    status_code=201,
    dependencies=[Depends(require_admin)],
    tags=["Admin API"],
)
async def add_item_sample_route(
    item_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="image file is empty")
    content_type = image.content_type or "image/jpeg"
    try:
        return upload_sample_image(db, item_id, image_bytes, content_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
