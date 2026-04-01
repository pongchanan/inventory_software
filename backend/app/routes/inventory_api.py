from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.inventory_event_api import InventoryEventCreate, InventoryEventResponse
from app.schemas.slot_occupancy_api import SlotOccupancyResponse
from app.services import inventory_service
from app.services.email_service import send_late_item_notifications, send_test_email_notification
from app.auth import get_current_user
from app.models.user import User


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


@router.post("/dev/send-late-reminders")
def send_late_reminders_dev(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Development endpoint: Send email reminders for overdue items.
    
    This endpoint is for testing/dev purposes only. Sends email notifications to users
    with overdue items. Can optionally send to a specific user.
    
    Query parameters:
    - user_id: Optional. If provided, sends reminder only to this user.
    
    Returns:
        dict: Summary of email notifications sent
        
    Example:
    - POST /api/inventory/dev/send-late-reminders (all users with overdue items)
    - POST /api/inventory/dev/send-late-reminders?user_id=5 (specific user)
    """
    result = send_late_item_notifications(db, user_id=user_id)
    return result


@router.post("/dev/send-test-email")
def send_test_email_dev(
    user_id: int,
    item_name: str = "Test Item",
    days_overdue: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Development endpoint: Send a test email reminder to any user.
    
    This endpoint is for testing/dev purposes only. Sends a test email notification
    to a specific user with customizable item details.
    
    Query parameters:
    - user_id: Required. User ID to send test email to.
    - item_name: Optional. Name of the test item (default: "Test Item")
    - days_overdue: Optional. Number of days overdue for test scenario (default: 5)
    
    Returns:
        dict: Result of test email send
        
    Example:
    - POST /api/inventory/dev/send-test-email?user_id=5&item_name=Laptop&days_overdue=10
    """
    result = send_test_email_notification(db, user_id, item_name, days_overdue)
    return result
