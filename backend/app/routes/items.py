from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.item import ItemOut, PaginatedItems
from app.services.auth_service import require_admin
from app.services.item_enroll_service import enroll_item
from app.services.items_service import get_active_items

router = APIRouter(prefix="/api/items", tags=["Items"])


@router.get("/", response_model=PaginatedItems)
def list_active_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_active_items(db, page, page_size)


@router.post("/enroll", response_model=dict, dependencies=[Depends(require_admin)])
async def enroll_item_route(
    name: str = Form(...),
    quantity: int = Form(..., ge=0),
    video: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    video_bytes = await video.read()
    if not video_bytes:
        raise HTTPException(status_code=400, detail="video file is empty")

    result = enroll_item(db, name=name, quantity=quantity, video_bytes=video_bytes)
    item = result["item"]
    return {
        "id": item.id,
        "name": item.name,
        "quantity": item.quantity,
        "is_active": item.is_active,
        "image": result["images"][0] if result["images"] else None,
        "accepted_count": result["accepted_count"],
        "rejected_count": result["rejected_count"],
        "frames_sampled": result["frames_sampled"],
    }
