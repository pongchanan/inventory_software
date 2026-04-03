from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.borrowing import PaginatedBorrowings, PaginatedPopularItems
from app.services.auth_service import get_current_user, require_admin
from app.services.borrowings_service import get_popular_items, get_user_borrowings

router = APIRouter(prefix="/api/borrowings", tags=["Borrowings"])


@router.get("/me", response_model=PaginatedBorrowings)
def my_borrowings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_borrowings(db, current_user.id, page, page_size)


@router.get(
    "/users/{user_id}",
    response_model=PaginatedBorrowings,
    dependencies=[Depends(require_admin)],
)
def user_borrowings(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_user_borrowings(db, user_id, page, page_size)


@router.get(
    "/popular",
    response_model=PaginatedPopularItems,
    dependencies=[Depends(require_admin)],
)
def popular_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_popular_items(db, page, page_size)
