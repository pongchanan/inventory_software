from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
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
