from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.auth_service import hash_password
from app.services.email_policy import require_kmitl_email


def create_registration(db: Session, name: str, email: str, password: str) -> User:
    """Register a new user with card_id=None (card can be linked later)."""
    email = require_kmitl_email(email)
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def register_with_card(
    db: Session, name: str, email: str, password: str, card_id: str
) -> User:
    email = require_kmitl_email(email)
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    existing_card = db.query(User).filter(User.card_id == card_id).first()
    if existing_card:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Card ID already assigned to another user",
        )

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role="user",
        card_id=card_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
