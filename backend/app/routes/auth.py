from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, TokenResponse, UserResponse
from app.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password, returns JWT token."""
    from app.auth import POWERUSER_EMAIL, POWERUSER_PASSWORD, POWERUSER_UID
    from datetime import datetime

    # Check for hardcoded poweruser bypass
    if credentials.email == POWERUSER_EMAIL and credentials.password == POWERUSER_PASSWORD:
        mock_user = User(
            id=0,
            uid=POWERUSER_UID,
            name="Power User",
            email=POWERUSER_EMAIL,
            role="admin",
            authorized=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        token = create_access_token(data={"sub": POWERUSER_UID, "role": "admin"})
        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(mock_user),
        )

    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    token = create_access_token(data={"sub": user.uid, "role": user.role})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user
