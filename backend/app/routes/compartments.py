from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.compartment import Compartment
from app.schemas.compartment import CompartmentCreate, CompartmentResponse, CompartmentUpdate

router = APIRouter(prefix="/api/compartments", tags=["compartments"])


@router.post("/", response_model=CompartmentResponse, status_code=status.HTTP_201_CREATED)
def create_compartment(compartment: CompartmentCreate, db: Session = Depends(get_db)):
    """Create a new compartment/locker"""
    existing = db.query(Compartment).filter(
        Compartment.locker_number == compartment.locker_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Compartment {compartment.locker_number} already exists"
        )
    
    db_compartment = Compartment(**compartment.model_dump())
    db.add(db_compartment)
    db.commit()
    db.refresh(db_compartment)
    return db_compartment


@router.get("/", response_model=List[CompartmentResponse])
def list_compartments(
    floor: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all compartments with optional filtering"""
    query = db.query(Compartment)
    
    if floor:
        query = query.filter(Compartment.floor == floor)
    
    if status_filter:
        query = query.filter(Compartment.status == status_filter)
    
    # Update overdue status
    compartments = query.all()
    for comp in compartments:
        if comp.status == "occupied" and comp.due_at and comp.due_at < datetime.utcnow():
            comp.status = "overdue"
    db.commit()
    
    return compartments


@router.get("/{locker_number}", response_model=CompartmentResponse)
def get_compartment(locker_number: str, db: Session = Depends(get_db)):
    """Get a specific compartment by locker number"""
    compartment = db.query(Compartment).filter(
        Compartment.locker_number == locker_number
    ).first()
    if not compartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Compartment {locker_number} not found"
        )
    return compartment


@router.put("/{locker_number}", response_model=CompartmentResponse)
def update_compartment(
    locker_number: str,
    update: CompartmentUpdate,
    db: Session = Depends(get_db)
):
    """Update compartment status and occupancy"""
    compartment = db.query(Compartment).filter(
        Compartment.locker_number == locker_number
    ).first()
    if not compartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Compartment {locker_number} not found"
        )
    
    # Update fields
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(compartment, key, value)
    
    # Auto-set occupied_at when status changes to occupied
    if update.status == "occupied" and not compartment.occupied_at:
        compartment.occupied_at = datetime.utcnow()
    
    # Clear occupied_at when available
    if update.status == "available":
        compartment.occupied_at = None
        compartment.item_uid = None
        compartment.user_uid = None
        compartment.due_at = None
    
    db.commit()
    db.refresh(compartment)
    return compartment


@router.delete("/{locker_number}", status_code=status.HTTP_204_NO_CONTENT)
def delete_compartment(locker_number: str, db: Session = Depends(get_db)):
    """Delete a compartment"""
    compartment = db.query(Compartment).filter(
        Compartment.locker_number == locker_number
    ).first()
    if not compartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Compartment {locker_number} not found"
        )
    
    db.delete(compartment)
    db.commit()
    return None
