from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.storage_api import (
    StorageUnitCreate, StorageUnitUpdate, StorageUnitResponse,
    StorageLocationCreate, StorageLocationResponse
)
from app.services import storage_service


router = APIRouter(prefix="/api/storage", tags=["storage"])


# Storage Units endpoints
@router.post("/units", response_model=StorageUnitResponse, status_code=status.HTTP_201_CREATED)
def create_storage_unit(unit: StorageUnitCreate, db: Session = Depends(get_db)):
    return storage_service.create_storage_unit(db, unit)


@router.get("/units", response_model=List[StorageUnitResponse])
def list_storage_units(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return storage_service.list_storage_units(db, skip, limit)


@router.get("/units/{unit_id}", response_model=StorageUnitResponse)
def get_storage_unit(unit_id: int, db: Session = Depends(get_db)):
    return storage_service.get_storage_unit_or_404(db, unit_id)


@router.patch("/units/{unit_id}", response_model=StorageUnitResponse)
def update_storage_unit(unit_id: int, unit_update: StorageUnitUpdate, db: Session = Depends(get_db)):
    return storage_service.update_storage_unit(db, unit_id, unit_update)


# Storage Locations endpoints
@router.post("/locations", response_model=StorageLocationResponse, status_code=status.HTTP_201_CREATED)
def create_storage_location(location: StorageLocationCreate, db: Session = Depends(get_db)):
    return storage_service.create_storage_location(db, location)


@router.get("/units/{unit_id}/locations", response_model=List[StorageLocationResponse])
def list_locations_by_unit(unit_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return storage_service.list_locations_by_unit(db, unit_id, skip, limit)


@router.get("/locations/{location_id}", response_model=StorageLocationResponse)
def get_storage_location(location_id: int, db: Session = Depends(get_db)):
    return storage_service.get_storage_location_or_404(db, location_id)


@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_storage_location(location_id: int, db: Session = Depends(get_db)):
    storage_service.delete_storage_location(db, location_id)
