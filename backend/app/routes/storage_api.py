from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.storage_unit_core import StorageUnit
from app.models.storage_location_core import StorageLocation
from app.schemas.storage_api import (
    StorageUnitCreate, StorageUnitUpdate, StorageUnitResponse,
    StorageLocationCreate, StorageLocationResponse
)


router = APIRouter(prefix="/api/storage", tags=["storage"])


# Storage Units endpoints
@router.post("/units", response_model=StorageUnitResponse, status_code=status.HTTP_201_CREATED)
def create_storage_unit(unit: StorageUnitCreate, db: Session = Depends(get_db)):
    """Create a new storage unit"""
    db_unit = StorageUnit(**unit.dict())
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.get("/units", response_model=List[StorageUnitResponse])
def list_storage_units(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all storage units"""
    units = db.query(StorageUnit).offset(skip).limit(limit).all()
    return units


@router.get("/units/{unit_id}", response_model=StorageUnitResponse)
def get_storage_unit(unit_id: int, db: Session = Depends(get_db)):
    """Get storage unit by ID"""
    unit = db.query(StorageUnit).filter(StorageUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage unit not found")
    return unit


@router.patch("/units/{unit_id}", response_model=StorageUnitResponse)
def update_storage_unit(unit_id: int, unit_update: StorageUnitUpdate, db: Session = Depends(get_db)):
    """Update storage unit"""
    unit = db.query(StorageUnit).filter(StorageUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage unit not found")
    
    update_data = unit_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(unit, key, value)
    
    db.commit()
    db.refresh(unit)
    return unit


# Storage Locations endpoints
@router.post("/locations", response_model=StorageLocationResponse, status_code=status.HTTP_201_CREATED)
def create_storage_location(location: StorageLocationCreate, db: Session = Depends(get_db)):
    """Create a new storage location"""
    # Validate unit exists
    unit = db.query(StorageUnit).filter(StorageUnit.id == location.unit_id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage unit not found")
    
    # Validate layout type constraints
    if unit.layout_type == "grid":
        if location.row_no is None or location.col_no is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                              detail="Grid layout requires row_no and col_no")
    elif unit.layout_type == "zone":
        if location.zone_code is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                              detail="Zone layout requires zone_code")
    
    db_location = StorageLocation(**location.dict())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location


@router.get("/units/{unit_id}/locations", response_model=List[StorageLocationResponse])
def list_locations_by_unit(unit_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all locations for a storage unit"""
    unit = db.query(StorageUnit).filter(StorageUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage unit not found")
    
    locations = db.query(StorageLocation).filter(
        StorageLocation.unit_id == unit_id
    ).offset(skip).limit(limit).all()
    return locations


@router.get("/locations/{location_id}", response_model=StorageLocationResponse)
def get_storage_location(location_id: int, db: Session = Depends(get_db)):
    """Get storage location by ID"""
    location = db.query(StorageLocation).filter(StorageLocation.id == location_id).first()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage location not found")
    return location


@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_storage_location(location_id: int, db: Session = Depends(get_db)):
    """Delete storage location"""
    location = db.query(StorageLocation).filter(StorageLocation.id == location_id).first()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage location not found")
    
    db.delete(location)
    db.commit()
