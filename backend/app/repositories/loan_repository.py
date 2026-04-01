"""Repository for loan/borrow queries."""
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session

from app.models.inventory_event_core import InventoryEvent
from app.models.item_type_core import ItemType


def get_overdue_loans(db: Session, user_id: int, days_threshold: int = 0) -> List[dict]:
    """
    Get list of overdue loans for a user.
    
    Args:
        db: Database session
        user_id: User ID
        days_threshold: Only show items overdue by this many days (0 = show all overdue)
        
    Returns:
        List of overdue loan dictionaries with item info and due date
    """
    # Get all borrow events for this user
    borrow_events = db.query(InventoryEvent).filter(
        InventoryEvent.user_id == user_id,
        InventoryEvent.event_type == "borrow"
    ).order_by(InventoryEvent.created_at.desc()).all()
    
    # Track which borrows have been returned
    return_events = db.query(InventoryEvent).filter(
        InventoryEvent.user_id == user_id,
        InventoryEvent.event_type == "return"
    ).all()
    
    # Create a set of returned item IDs for quick lookup
    returned_item_ids = set()
    for return_event in return_events:
        returned_item_ids.add(return_event.id)
    
    # Calculate overdue items (14-day default loan period)
    LOAN_PERIOD_DAYS = 14
    now = datetime.utcnow()
    overdue_loans = []
    
    for borrow_event in borrow_events:
        due_date = borrow_event.created_at + timedelta(days=LOAN_PERIOD_DAYS)
        
        # Skip if already returned
        if borrow_event.id in returned_item_ids:
            continue
        
        # Check if overdue
        if now > due_date:
            days_overdue = (now - due_date).days
            
            if days_overdue >= days_threshold:
                # Get item type info
                item_type = db.query(ItemType).filter(
                    ItemType.id == borrow_event.item_type_id
                ).first()
                
                overdue_loans.append({
                    "event_id": borrow_event.id,
                    "item_name": item_type.name if item_type else f"Item {borrow_event.item_type_id}",
                    "item_type_id": borrow_event.item_type_id,
                    "borrowed_at": borrow_event.created_at.isoformat(),
                    "due_date": due_date.strftime("%Y-%m-%d"),
                    "days_overdue": days_overdue,
                    "quantity": borrow_event.quantity
                })
    
    return overdue_loans
