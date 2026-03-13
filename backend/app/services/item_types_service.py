from __future__ import annotations

from pathlib import Path
from typing import List

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.item_type_core import ItemType
from app.models.item_type_image_core import ItemTypeImage
from app.s3 import generate_presigned_url, upload_file_to_s3
from app.schemas.item_type_api import ItemTypeCreate, ItemTypeUpdate


def create_item_type(db: Session, payload: ItemTypeCreate) -> ItemType:
    db_item_type = ItemType(**payload.model_dump())
    db.add(db_item_type)
    db.commit()
    db.refresh(db_item_type)
    return db_item_type


def list_item_types(db: Session, skip: int, limit: int) -> List[ItemType]:
    item_types = db.query(ItemType).offset(skip).limit(limit).all()
    for item_type in item_types:
        item_type.images = db.query(ItemTypeImage).filter(ItemTypeImage.item_type_id == item_type.id).all()
    return item_types


def get_item_type_or_404(db: Session, item_type_id: int) -> ItemType:
    item_type = db.query(ItemType).filter(ItemType.id == item_type_id).first()
    if not item_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item type not found")
    return item_type


def get_item_type_detail_or_404(db: Session, item_type_id: int) -> ItemType:
    item_type = get_item_type_or_404(db, item_type_id)
    item_type.images = db.query(ItemTypeImage).filter(ItemTypeImage.item_type_id == item_type_id).all()
    return item_type


def update_item_type(db: Session, item_type_id: int, item_type_update: ItemTypeUpdate) -> ItemType:
    item_type = get_item_type_or_404(db, item_type_id)
    update_data = item_type_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item_type, key, value)
    db.commit()
    db.refresh(item_type)
    return item_type


def delete_item_type(db: Session, item_type_id: int) -> None:
    item_type = get_item_type_or_404(db, item_type_id)
    db.delete(item_type)
    db.commit()


def upload_item_type_image(db: Session, item_type_id: int, image_file: UploadFile, is_primary: bool) -> ItemType:
    item_type = get_item_type_or_404(db, item_type_id)

    suffix = Path(image_file.filename or "").suffix.lower()
    if not suffix:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image file extension is required")

    raw_bytes = image_file.file.read()
    if not raw_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded image is empty")

    key = upload_file_to_s3(raw_bytes, uid=f"TYPE-{item_type_id}", file_ext=suffix)
    public_url = generate_presigned_url(key, expires_in=7 * 24 * 3600)

    if is_primary:
        db.query(ItemTypeImage).filter(ItemTypeImage.item_type_id == item_type_id).update({"is_primary": False})

    image = ItemTypeImage(item_type_id=item_type_id, image_url=public_url, is_primary=is_primary)
    db.add(image)
    db.commit()

    return get_item_type_detail_or_404(db, item_type_id)
