from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.registration import Registration
from app.models.user import User
from app.services.auth_service import hash_password


def create_registration(
    db: Session, name: str, email: str, password: str
) -> Registration:
    # Check if email already exists in users
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered as a user",
        )

    # Check if email already pending in registrations
    existing_reg = db.query(Registration).filter(Registration.email == email).first()
    if existing_reg:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already has a pending registration",
        )

    reg = Registration(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role="user",
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg


def complete_registration(db: Session, registration_id: int, card_id: str) -> User:
    reg = db.query(Registration).filter(Registration.id == registration_id).first()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found"
        )

    # Check card_id not already taken
    existing_card = db.query(User).filter(User.card_id == card_id).first()
    if existing_card:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Card ID already assigned to another user",
        )

    # Move data to users table
    user = User(
        name=reg.name,
        email=reg.email,
        password_hash=reg.password_hash,
        role=reg.role,
        card_id=card_id,
    )
    db.add(user)
    db.delete(reg)
    db.commit()
    db.refresh(user)
    return user


def get_registration_by_credentials(
    db: Session, email: str, password: str
) -> Registration:
    from app.services.auth_service import verify_password

    reg = db.query(Registration).filter(Registration.email == email).first()
    if not reg or not verify_password(password, reg.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return reg


def register_with_card(
    db: Session, name: str, email: str, password: str, card_id: str
) -> User:
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

    # Also clean up any pending registration for this email
    pending = db.query(Registration).filter(Registration.email == email).first()
    if pending:
        db.delete(pending)

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
    return reg
