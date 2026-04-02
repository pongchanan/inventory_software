from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserOut
from app.schemas.user import UserUpdate
from app.services.auth_service import require_admin
from app.services.users_service import get_all_users, get_user_by_id, update_user
from app.mqtt.client import publish
from app.mqtt.handlers.card_registration_store import (
    set_pending_user,
    wait_for_card,
    clear_pending,
)

router = APIRouter(
    prefix="/api/users", tags=["Users"], dependencies=[Depends(require_admin)]
)


@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return get_all_users(db)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return get_user_by_id(db, user_id)


@router.patch("/{user_id}", response_model=UserOut)
def edit_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db)):
    return update_user(db, user_id, body.model_dump(exclude_unset=True))


@router.post("/{user_id}/link-card", response_model=UserOut)
def link_card(user_id: int, db: Session = Depends(get_db)):
    """Tell IoT to enter register mode and wait for card scan, then link card to user."""
    user = get_user_by_id(db, user_id)

    if user.card_id:
        raise HTTPException(status_code=409, detail="User already has a card linked")

    set_pending_user(user.id)
    publish("register-card", {"user_id": user.id, "action": "start"})

    card_id = wait_for_card(timeout=15.0)
    clear_pending()

    if not card_id:
        raise HTTPException(status_code=408, detail="Card scan timed out")

    db.refresh(user)
    return user
