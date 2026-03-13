from __future__ import annotations

from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.storage_location_core import StorageLocation
from app.models.storage_unit_core import StorageUnit
from app.schemas.storage_api import (
    StorageLocationCreate,
    StorageUnitCreate,
    StorageUnitUpdate,
)


def create_storage_unit(db: Session, unit: StorageUnitCreate) -> StorageUnit:
    db_unit = StorageUnit(**unit.model_dump())
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit


def list_storage_units(db: Session, skip: int, limit: int) -> List[StorageUnit]:
    return db.query(StorageUnit).offset(skip).limit(limit).all()


def get_storage_unit_or_404(db: Session, unit_id: int) -> StorageUnit:
    unit = db.query(StorageUnit).filter(StorageUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage unit not found")
    return unit


def update_storage_unit(db: Session, unit_id: int, unit_update: StorageUnitUpdate) -> StorageUnit:
    unit = get_storage_unit_or_404(db, unit_id)
    update_data = unit_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(unit, key, value)

    db.commit()
    db.refresh(unit)
    return unit


def create_storage_location(db: Session, location: StorageLocationCreate) -> StorageLocation:
    unit = get_storage_unit_or_404(db, location.unit_id)

    if unit.layout_type == "grid":
        if location.row_no is None or location.col_no is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Grid layout requires row_no and col_no",
            )
    elif unit.layout_type == "zone":
        if location.zone_code is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Zone layout requires zone_code",
            )

    db_location = StorageLocation(**location.model_dump())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location


def list_locations_by_unit(db: Session, unit_id: int, skip: int, limit: int) -> List[StorageLocation]:
    get_storage_unit_or_404(db, unit_id)
    return (
        db.query(StorageLocation)
        .filter(StorageLocation.unit_id == unit_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_storage_location_or_404(db: Session, location_id: int) -> StorageLocation:
    location = db.query(StorageLocation).filter(StorageLocation.id == location_id).first()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage location not found")
    return location


def delete_storage_location(db: Session, location_id: int) -> None:
    location = get_storage_location_or_404(db, location_id)
    db.delete(location)
    db.commit()
