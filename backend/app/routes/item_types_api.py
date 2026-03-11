from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.item_type_core import ItemType
from app.models.item_type_image_core import ItemTypeImage
from app.schemas.item_type_api import (
    ItemTypeCreate, ItemTypeUpdate, ItemTypeResponse, ItemTypeDetailResponse
)


router = APIRouter(prefix="/api/item-types", tags=["item-types"])


@router.post("", response_model=ItemTypeResponse, status_code=status.HTTP_201_CREATED)
def create_item_type(item_type: ItemTypeCreate, db: Session = Depends(get_db)):
    """Create a new item type"""
    db_item_type = ItemType(**item_type.dict())
    db.add(db_item_type)
    db.commit()
    db.refresh(db_item_type)
    return db_item_type


@router.get("", response_model=List[ItemTypeDetailResponse])
def list_item_types(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all item types with their images"""
    item_types = db.query(ItemType).offset(skip).limit(limit).all()
    for it in item_types:
        it.images = db.query(ItemTypeImage).filter(ItemTypeImage.item_type_id == it.id).all()
    return item_types


@router.get("/{item_type_id}", response_model=ItemTypeDetailResponse)
def get_item_type(item_type_id: int, db: Session = Depends(get_db)):
    """Get item type by ID with images"""
    item_type = db.query(ItemType).filter(ItemType.id == item_type_id).first()
    if not item_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item type not found")
    
    item_type.images = db.query(ItemTypeImage).filter(ItemTypeImage.item_type_id == item_type_id).all()
    return item_type


@router.patch("/{item_type_id}", response_model=ItemTypeResponse)
def update_item_type(item_type_id: int, item_type_update: ItemTypeUpdate, db: Session = Depends(get_db)):
    """Update item type"""
    item_type = db.query(ItemType).filter(ItemType.id == item_type_id).first()
    if not item_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item type not found")
    
    update_data = item_type_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item_type, key, value)
    
    db.commit()
    db.refresh(item_type)
    return item_type


@router.delete("/{item_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item_type(item_type_id: int, db: Session = Depends(get_db)):
    """Delete item type (soft delete by setting active=False recommended)"""
    item_type = db.query(ItemType).filter(ItemType.id == item_type_id).first()
    if not item_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item type not found")
    
    db.delete(item_type)
    db.commit()
