from __future__ import annotations

from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user_api import UserCreate, UserUpdate


def create_user(db: Session, user: UserCreate) -> User:
    existing = db.query(User).filter(User.nfc_card_uid == user.nfc_card_uid).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="NFC card UID already exists")

    if user.email:
        existing_email = db.query(User).filter(User.email == user.email).first()
        if existing_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    payload = user.model_dump(exclude={"password"})
    db_user = User(**payload)
    if user.password:
        from app.routes import users_api as users_routes

        db_user.password_hash = users_routes.hash_password(user.password)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def list_users(db: Session, skip: int, limit: int) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def get_user_by_nfc_or_404(db: Session, nfc_card_uid: str) -> User:
    user = db.query(User).filter(User.nfc_card_uid == nfc_card_uid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def update_user(db: Session, user_id: int, user_update: UserUpdate) -> User:
    user = get_user_or_404(db, user_id)
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> None:
    user = get_user_or_404(db, user_id)
    db.delete(user)
    db.commit()
