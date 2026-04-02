from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserOut
from app.services.auth_service import get_current_user
from app.mqtt.client import publish
from app.mqtt.handlers.card_registration_store import (
    set_pending_user,
    wait_for_card,
    clear_pending,
)

router = APIRouter(prefix="/api/users/me", tags=["Card"])


@router.post("/link-card", response_model=UserOut)
def link_card(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tell IoT to enter register mode, wait for card scan, link card to current user."""
    if current_user.card_id:
        raise HTTPException(status_code=409, detail="You already have a card linked")

    set_pending_user(current_user.id)
    publish("register-card", {"user_id": current_user.id, "action": "start"})

    card_id = wait_for_card(timeout=15.0)
    clear_pending()

    if not card_id:
        raise HTTPException(status_code=408, detail="Card scan timed out")

    db.refresh(current_user)
    return current_user


@router.post("/unlink-card", response_model=UserOut)
def unlink_card(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove the linked card from the current user."""
    if not current_user.card_id:
        raise HTTPException(status_code=400, detail="No card linked to unlink")

    current_user.card_id = None
    db.commit()
    db.refresh(current_user)
    return current_user
