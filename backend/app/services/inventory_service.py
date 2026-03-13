from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.inventory_event_core import InventoryEvent
from app.models.slot_occupancy_core import SlotOccupancy
from app.models.storage_location_core import StorageLocation
from app.schemas.inventory_event_api import InventoryEventCreate


def create_inventory_event(db: Session, payload: InventoryEventCreate) -> InventoryEvent:
    db_event = InventoryEvent(**payload.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    if payload.location_id:
        update_slot_occupancy(
            db=db,
            location_id=payload.location_id,
            item_type_id=payload.item_type_id,
            event_type=payload.event_type,
            event_id=db_event.id,
        )

    return db_event


def list_inventory_events(
    db: Session,
    user_id: Optional[int],
    item_type_id: Optional[int],
    event_type: Optional[str],
    session_id: Optional[int],
    skip: int,
    limit: int,
) -> List[InventoryEvent]:
    query = db.query(InventoryEvent)

    if user_id:
        query = query.filter(InventoryEvent.user_id == user_id)
    if item_type_id:
        query = query.filter(InventoryEvent.item_type_id == item_type_id)
    if event_type:
        query = query.filter(InventoryEvent.event_type == event_type)
    if session_id:
        query = query.filter(InventoryEvent.session_id == session_id)

    return query.order_by(InventoryEvent.created_at.desc()).offset(skip).limit(limit).all()


def get_inventory_event_or_404(db: Session, event_id: int) -> InventoryEvent:
    event = db.query(InventoryEvent).filter(InventoryEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


def get_location_occupancy(db: Session, location_id: int) -> SlotOccupancy | dict:
    _ensure_location_exists(db, location_id)
    occupancy = db.query(SlotOccupancy).filter(SlotOccupancy.location_id == location_id).first()

    if occupancy:
        return occupancy

    return {
        "location_id": location_id,
        "state": "unknown",
        "item_type_id": None,
        "confidence": None,
        "last_event_id": None,
        "updated_at": datetime.utcnow(),
    }


def get_unit_occupancies(db: Session, unit_id: int) -> List[SlotOccupancy | dict]:
    locations = db.query(StorageLocation).filter(StorageLocation.unit_id == unit_id).all()
    if not locations:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage unit not found")

    results: List[SlotOccupancy | dict] = []
    for location in locations:
        occupancy = db.query(SlotOccupancy).filter(SlotOccupancy.location_id == location.id).first()
        if occupancy:
            results.append(occupancy)
        else:
            results.append(
                {
                    "location_id": location.id,
                    "state": "unknown",
                    "item_type_id": None,
                    "confidence": None,
                    "last_event_id": None,
                    "updated_at": datetime.utcnow(),
                }
            )

    return results


def update_slot_occupancy(
    db: Session,
    location_id: int,
    item_type_id: Optional[int],
    event_type: str,
    event_id: int,
) -> SlotOccupancy:
    _ensure_location_exists(db, location_id)

    occupancy = db.query(SlotOccupancy).filter(SlotOccupancy.location_id == location_id).first()

    state = _event_type_to_state(event_type)
    resolved_item_type_id = item_type_id if state == "occupied" else None

    if not occupancy:
        occupancy = SlotOccupancy(
            location_id=location_id,
            state=state,
            item_type_id=resolved_item_type_id,
            last_event_id=event_id,
        )
        db.add(occupancy)
    else:
        occupancy.state = state
        occupancy.item_type_id = resolved_item_type_id
        occupancy.last_event_id = event_id

    db.commit()
    db.refresh(occupancy)
    return occupancy


def _event_type_to_state(event_type: str) -> str:
    if event_type in {"borrow", "removed"}:
        return "empty"
    if event_type in {"return", "added"}:
        return "occupied"
    if event_type in {"adjustment", "manual_resolution"}:
        return "unknown"
    return "unknown"


def _ensure_location_exists(db: Session, location_id: int) -> StorageLocation:
    location = db.query(StorageLocation).filter(StorageLocation.id == location_id).first()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Storage location not found")
    return location
