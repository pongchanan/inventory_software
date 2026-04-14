from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import UserOut
from app.schemas.user import UserUpdate
from app.services.auth_service import require_admin
from app.services.users_service import get_all_users, get_user_by_id, update_user

router = APIRouter(
    prefix="/api/users", tags=["Admin API"], dependencies=[Depends(require_admin)]
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
    return current_user
