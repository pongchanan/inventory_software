from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.inventory_event_core import InventoryEvent
from app.models.slot_occupancy_core import SlotOccupancy
from app.models.storage_location_core import StorageLocation
from app.models.item_type_core import ItemType
from app.schemas.inventory_event_api import InventoryEventCreate, InventoryEventResponse
from app.schemas.slot_occupancy_api import SlotOccupancyResponse


router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.post("/events", response_model=InventoryEventResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_event(event: InventoryEventCreate, db: Session = Depends(get_db)):
    """Create inventory event (business transaction)"""
    db_event = InventoryEvent(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # Update slot occupancy if location is provided
    if event.location_id:
        update_slot_occupancy(event.location_id, event.item_type_id, event.event_type, db_event.id, db)
    
    return db_event


@router.get("/events", response_model=List[InventoryEventResponse])
def list_inventory_events(
    user_id: Optional[int] = None,
    item_type_id: Optional[int] = None,
    event_type: Optional[str] = None,
    session_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List inventory events"""
    query = db.query(InventoryEvent)
    
    if user_id:
        query = query.filter(InventoryEvent.user_id == user_id)
    if item_type_id:
        query = query.filter(InventoryEvent.item_type_id == item_type_id)
    if event_type:
        query = query.filter(InventoryEvent.event_type == event_type)
    if session_id:
        query = query.filter(InventoryEvent.session_id == session_id)
    
    events = query.order_by(InventoryEvent.created_at.desc()).offset(skip).limit(limit).all()
    return events


@router.get("/events/{event_id}", response_model=InventoryEventResponse)
def get_inventory_event(event_id: int, db: Session = Depends(get_db)):
    """Get inventory event by ID"""
    event = db.query(InventoryEvent).filter(InventoryEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@router.get("/occupancy/location/{location_id}", response_model=SlotOccupancyResponse)
def get_occupancy(location_id: int, db: Session = Depends(get_db)):
    """Get current occupancy of a location"""
    occupancy = db.query(SlotOccupancy).filter(
        SlotOccupancy.location_id == location_id
    ).first()
    
    if not occupancy:
        # Return default empty state
        return {
            "location_id": location_id,
            "state": "unknown",
            "item_type_id": None,
            "confidence": None,
            "last_event_id": None,
            "updated_at": None
        }
    
    return occupancy


@router.get("/occupancy/unit/{unit_id}")
def get_unit_occupancies(unit_id: int, db: Session = Depends(get_db)):
    """Get all occupancies for a storage unit"""
    locations = db.query(StorageLocation).filter(
        StorageLocation.unit_id == unit_id
    ).all()
    
    occupancies = []
    for loc in locations:
        occ = db.query(SlotOccupancy).filter(
            SlotOccupancy.location_id == loc.id
        ).first()
        
        if occ:
            occupancies.append(occ)
        else:
            occupancies.append({
                "location_id": loc.id,
                "state": "unknown",
                "item_type_id": None,
                "confidence": None,
                "last_event_id": None
            })
    
    return occupancies


def update_slot_occupancy(location_id: int, item_type_id: Optional[int], 
                         event_type: str, event_id: int, db: Session):
    """Helper function to update slot occupancy based on event"""
    occupancy = db.query(SlotOccupancy).filter(
        SlotOccupancy.location_id == location_id
    ).first()
    
    if event_type == "borrow" or event_type == "removed":
        state = "empty"
        item_type_id = None
    elif event_type == "return" or event_type == "added":
        state = "occupied"
    else:
        state = "unknown"
    
    if not occupancy:
        occupancy = SlotOccupancy(
            location_id=location_id,
            state=state,
            item_type_id=item_type_id,
            last_event_id=event_id
        )
        db.add(occupancy)
    else:
        occupancy.state = state
        occupancy.item_type_id = item_type_id
        occupancy.last_event_id = event_id
    
    db.commit()
