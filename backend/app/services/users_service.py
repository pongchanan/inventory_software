from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User


def get_all_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.id).all()


def get_user_by_id(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


def verify_card(db: Session, card_id: str) -> bool:
    """Check valid user during open the inventory"""
    user = db.query(User).filter(User.card_id == card_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Card not found"
        )
    if user.is_blacklist:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User is blacklisted"
        )
    return user


def update_user(db: Session, user_id: int, data: dict) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    for key, value in data.items():
        if value is not None:
            setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user
