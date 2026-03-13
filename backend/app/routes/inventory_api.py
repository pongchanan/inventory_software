from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.inventory_event_api import InventoryEventCreate, InventoryEventResponse
from app.schemas.slot_occupancy_api import SlotOccupancyResponse
from app.services import inventory_service


router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.post("/events", response_model=InventoryEventResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_event(event: InventoryEventCreate, db: Session = Depends(get_db)):
    return inventory_service.create_inventory_event(db, event)


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
    return inventory_service.list_inventory_events(
        db,
        user_id=user_id,
        item_type_id=item_type_id,
        event_type=event_type,
        session_id=session_id,
        skip=skip,
        limit=limit,
    )


@router.get("/events/{event_id}", response_model=InventoryEventResponse)
def get_inventory_event(event_id: int, db: Session = Depends(get_db)):
    return inventory_service.get_inventory_event_or_404(db, event_id)


@router.get("/occupancy/location/{location_id}", response_model=SlotOccupancyResponse)
def get_occupancy(location_id: int, db: Session = Depends(get_db)):
    return inventory_service.get_location_occupancy(db, location_id)


@router.get("/occupancy/unit/{unit_id}")
def get_unit_occupancies(unit_id: int, db: Session = Depends(get_db)):
    return inventory_service.get_unit_occupancies(db, unit_id)
