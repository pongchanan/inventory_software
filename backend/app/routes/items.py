from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime
from app.database import get_db
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemResponse

router = APIRouter(prefix="/api/items", tags=["items"])


@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    """Create a new item"""
    # Check if UID already exists
    existing = db.query(Item).filter(Item.uid == item.uid).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Item with UID {item.uid} already exists"
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
            detail=f"Item with UID {uid} not found"
        )
    return item


@router.get("/", response_model=List[ItemResponse])
def list_items(
    skip: int = 0,
    limit: int = 100,
    available: bool = None,
    db: Session = Depends(get_db)
):
    """List all items with optional filtering"""
    query = db.query(Item)
    
    if available is not None:
        query = query.filter(Item.available == available)
    
    items = query.offset(skip).limit(limit).all()
    return items


@router.put("/{uid}", response_model=ItemResponse)
def update_item(uid: str, item_update: ItemCreate, db: Session = Depends(get_db)):
    """Update item information"""
    item = db.query(Item).filter(Item.uid == uid).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with UID {uid} not found"
        )
    
    for key, value in item_update.model_dump().items():
        setattr(item, key, value)
    
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{uid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(uid: str, db: Session = Depends(get_db)):
    """Delete an item"""
    item = db.query(Item).filter(Item.uid == uid).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with UID {uid} not found"
        )
    
    db.delete(item)
    db.commit()
    return None


@router.post("/{uid}/upload-image", response_model=ItemResponse)
async def upload_item_image(
    uid: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload an image for an item (Admin only)"""
    # Verify item exists
    item = db.query(Item).filter(Item.uid == uid).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with UID {uid} not found"
        )
    
    # Validate file type
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Create unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{uid}_{timestamp}{file_ext}"
    file_path = f"uploads/items/{filename}"
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image: {str(e)}"
        )
    
    # Update item with image URL
    item.image_url = f"/uploads/items/{filename}"
    db.commit()
    db.refresh(item)
    
    return item


@router.get("/by-location/{location}", response_model=List[ItemResponse])
def get_items_by_location(
    location: str,
    available_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all items in a specific location/compartment"""
    query = db.query(Item).filter(Item.location == location)
    
    if available_only:
        query = query.filter(Item.available == True)
    
    items = query.all()
    return items
