from typing import List, Optional
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.item_type_api import (
    ItemTypeCreate, ItemTypeUpdate, ItemTypeResponse, ItemTypeDetailResponse
)
from app.services import item_types_service


router = APIRouter(prefix="/api/item-types", tags=["item-types"])


@router.post("", response_model=ItemTypeResponse, status_code=status.HTTP_201_CREATED)
def create_item_type(item_type: ItemTypeCreate, db: Session = Depends(get_db)):
    return item_types_service.create_item_type(db, item_type)


@router.get("", response_model=List[ItemTypeDetailResponse])
def list_item_types(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return item_types_service.list_item_types(db, skip, limit)


@router.get("/{item_type_id}", response_model=ItemTypeDetailResponse)
def get_item_type(item_type_id: int, db: Session = Depends(get_db)):
    return item_types_service.get_item_type_detail_or_404(db, item_type_id)


@router.patch("/{item_type_id}", response_model=ItemTypeResponse)
def update_item_type(item_type_id: int, item_type_update: ItemTypeUpdate, db: Session = Depends(get_db)):
    return item_types_service.update_item_type(db, item_type_id, item_type_update)


@router.delete("/{item_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item_type(item_type_id: int, db: Session = Depends(get_db)):
    item_types_service.delete_item_type(db, item_type_id)


@router.post("/{item_type_id}/images", response_model=ItemTypeDetailResponse)
def upload_item_type_image(
    item_type_id: int,
    image_file: UploadFile = File(...),
    is_primary: bool = False,
    db: Session = Depends(get_db),
):
    return item_types_service.upload_item_type_image(db, item_type_id, image_file, is_primary)
