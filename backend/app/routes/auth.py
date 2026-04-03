from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterWithCardRequest,
    UserOut,
)
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_current_user,
)
from app.services.registration_service import (
    create_registration,
    register_with_card,
)
from app.models.user import User
from app.mqtt.client import publish
from app.mqtt.handlers.card_registration_store import (
    set_pending_user,
    wait_for_card,
    clear_pending,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    token = create_access_token(user.id, user.role)
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user. If register_card_now=true, tells IoT to enter
    register mode and waits for card scan before responding."""
    user = create_registration(db, body.name, body.email, body.password)

    if body.register_card_now:
        set_pending_user(user.id)
        publish("card/register", {"user_id": user.id, "action": "start"})

        card_id = wait_for_card(timeout=15.0)
        clear_pending()

        if card_id:
            db.refresh(user)
        else:
            print(f"[register] Card scan timed out for user #{user.id}")

    return user


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
