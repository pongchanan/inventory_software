from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
from app.database import get_db
from app.models.item import Item
from app.models.user import User
from app.schemas.item import ItemCreate, ItemResponse
from app.auth import require_admin
from app.s3 import upload_file_to_s3, generate_presigned_url, delete_file_from_s3


def _is_legacy_path(image_url: str) -> bool:
    """Return True if the image_url is an old-style local /uploads/ path."""
    return image_url.startswith("/uploads/")


router = APIRouter(prefix="/api/items", tags=["items"])


@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    item: ItemCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new item (Admin only)"""
    # Check if UID already exists
    existing = db.query(Item).filter(Item.uid == item.uid).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Item with UID {item.uid} already exists",
        )

    db_item = Item(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/{uid}", response_model=ItemResponse)
def get_item(uid: str, db: Session = Depends(get_db)):
    """Get item by UID"""
    item = db.query(Item).filter(Item.uid == uid).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with UID {uid} not found",
        )
    return item


@router.get("/", response_model=List[ItemResponse])
def list_items(
    skip: int = 0,
    limit: int = 100,
    available: bool = None,
    db: Session = Depends(get_db),
):
    """List all items with optional filtering"""
    query = db.query(Item)

    if available is not None:
        query = query.filter(Item.available == available)

    items = query.offset(skip).limit(limit).all()
    return items


@router.put("/{uid}", response_model=ItemResponse)
def update_item(
    uid: str,
    item_update: ItemCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update item information (Admin only)"""
    item = db.query(Item).filter(Item.uid == uid).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with UID {uid} not found",
        )

    for key, value in item_update.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{uid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    uid: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)
):
    """Delete an item (Admin only)"""
    item = db.query(Item).filter(Item.uid == uid).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with UID {uid} not found",
        )

    db.delete(item)
    db.commit()
    return None


@router.post("/{uid}/upload-image", response_model=ItemResponse)
async def upload_item_image(
    uid: str,
    file: UploadFile = File(...),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Upload an image for an item to S3 storage (Admin only)"""
    # Verify item exists
    item = db.query(Item).filter(Item.uid == uid).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with UID {uid} not found",
        )

    file_ext = os.path.splitext(file.filename)[1].lower()
    file_bytes = await file.read()

    # Delete old image (S3 key or legacy local file)
    if item.image_url:
        if _is_legacy_path(item.image_url):
            # Remove the legacy file from disk if it exists
            legacy_file = item.image_url.lstrip("/")  # "uploads/items/..."
            if os.path.isfile(legacy_file):
                try:
                    os.remove(legacy_file)
                except OSError:
                    pass
        else:
            delete_file_from_s3(item.image_url)

    # Upload to S3 (validates extension internally)
    s3_key = upload_file_to_s3(file_bytes, uid, file_ext)

    # Store the S3 object key in the DB (not a full URL)
    item.image_url = s3_key
    db.commit()
    db.refresh(item)

    return item


@router.get("/{uid}/image-url")
def get_item_image_url(uid: str, request: Request, db: Session = Depends(get_db)):
    """
    Get a URL for an item's image.

    - New S3 images  → returns a presigned URL.
    - Legacy local images (uploaded before the S3 migration) → returns
      the full URL pointing at the still-mounted /uploads/ static path.
    """
    item = db.query(Item).filter(Item.uid == uid).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with UID {uid} not found",
        )
    if not item.image_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="This item has no image"
        )

    if _is_legacy_path(item.image_url):
        # Legacy images were stored on local disk which is ephemeral on Railway.
        # Check if the file still exists; if not, clear the stale path.
        legacy_file = item.image_url.lstrip("/")  # "uploads/items/..."
        if os.path.isfile(legacy_file):
            base_url = str(request.base_url).rstrip("/")
            return {"url": f"{base_url}{item.image_url}"}
        else:
            # File is gone (Railway redeploy wiped it).
            # Clear the stale path so we don't keep checking.
            item.image_url = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Legacy image no longer available. Please re-upload.",
            )

    url = generate_presigned_url(item.image_url, expires_in=3600)
    return {"url": url}


@router.get("/by-location/{location}", response_model=List[ItemResponse])
def get_items_by_location(
    location: str, available_only: bool = False, db: Session = Depends(get_db)
):
    """Get all items in a specific location/compartment"""
    query = db.query(Item).filter(Item.location == location)

    if available_only:
        query = query.filter(Item.available == True)

    items = query.all()
    return items
