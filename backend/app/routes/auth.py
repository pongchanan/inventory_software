from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterCompleteRequest,
    RegisterRequest,
    RegistrationOut,
    UserOut,
)
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_current_user,
)
from app.services.registration_service import (
    complete_registration,
    create_registration,
    list_pending_registrations,
)
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    token = create_access_token(user.id, user.role)
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=RegistrationOut, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Step 1: Create a pending registration (card scan comes later)."""
    reg = create_registration(db, body.name, body.email, body.password)
    return reg


@router.post("/register/complete", response_model=UserOut, status_code=201)
def register_complete(body: RegisterCompleteRequest, db: Session = Depends(get_db)):
    """Step 2: Scan card to finish registration — moves data to users, deletes from registrations."""
    user = complete_registration(db, body.registration_id, body.card_id)
    return user


@router.get("/registrations", response_model=list[RegistrationOut])
def get_pending_registrations(db: Session = Depends(get_db)):
    """List all pending registrations waiting for card scan."""
    return list_pending_registrations(db)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
