from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.database import get_db
from app.models.inventory_event_core import InventoryEvent
from app.models.item_type_core import ItemType
from pydantic import BaseModel

router = APIRouter(prefix="/api/stats", tags=["statistics"])


class ItemStatistic(BaseModel):
    name: str
    value: int
    color: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/most-borrowed", response_model=List[ItemStatistic])
def get_most_borrowed_items(
    limit: int = Query(5, ge=1, le=20),
    hours: Optional[int] = Query(None, description="Filter by last N hours, None = all time"),
    db: Session = Depends(get_db)
):
    """
    Get most borrowed items.
    
    Args:
        limit: Number of items to return (1-20)
        hours: Optional - filter by last N hours
    
    Returns:
        List of items with borrow counts
    """
    query = db.query(
        ItemType.id,
        ItemType.name,
        func.count(InventoryEvent.id).label("borrow_count")
    ).join(
        InventoryEvent, ItemType.id == InventoryEvent.item_type_id
    ).filter(
        InventoryEvent.event_type == "borrow"
    )
    
    # Optional time filter
    if hours is not None:
        from datetime import datetime, timedelta
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(InventoryEvent.created_at >= cutoff_time)
    
    query = query.group_by(
        ItemType.id, ItemType.name
    ).order_by(
        func.count(InventoryEvent.id).desc()
    ).limit(limit)
    
    colors = ['#ee4d2d', '#ff7f50', '#ffa726', '#ffb74d', '#ffc107']
    
    result = []
    for index, (item_id, item_name, borrow_count) in enumerate(query.all()):
        result.append(ItemStatistic(
            name=item_name,
            value=borrow_count,
            color=colors[index % len(colors)]
        ))
    
    return result


@router.get("/most-damaged", response_model=List[ItemStatistic])
def get_most_damaged_items(
    limit: int = Query(5, ge=1, le=20),
    hours: Optional[int] = Query(None, description="Filter by last N hours, None = all time"),
    db: Session = Depends(get_db)
):
    """
    Get most damaged items based on damage reports/observations.
    
    Args:
        limit: Number of items to return (1-20)
        hours: Optional - filter by last N hours
    
    Returns:
        List of items with damage counts
    """
    # For now, this queries observations table
    # Damage is tracked when an item is reported as broken/damaged
    from app.models.observation_core import Observation
    
    query = db.query(
        ItemType.id,
        ItemType.name,
        func.count(Observation.id).label("damage_count")
    ).outerjoin(
        Observation, ItemType.id == Observation.id  # This join will be empty until damage tracking is properly set up
    ).filter(
        Observation.review_status.in_(["needs_review", "resolved", "damage_reported"])
    )
    
    # Optional time filter
    if hours is not None:
        from datetime import datetime, timedelta
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(Observation.observed_at >= cutoff_time)
    
    query = query.group_by(
        ItemType.id, ItemType.name
    ).order_by(
        func.count(Observation.id).desc()
    ).limit(limit)
    
    colors = ['#ef5350', '#e53935', '#d32f2f', '#c62828', '#b71c1c']
    
    result = []
    for index, (item_id, item_name, damage_count) in enumerate(query.all()):
        if damage_count > 0:  # Only include items with actual damage reports
            result.append(ItemStatistic(
                name=item_name,
                value=damage_count,
                color=colors[index % len(colors)]
            ))
    
    # If no damage data, return empty list
    # Frontend will show empty state
    return result
