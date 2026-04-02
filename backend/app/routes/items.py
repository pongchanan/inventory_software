from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.item import PaginatedItems
from app.services.items_service import get_active_items

router = APIRouter(prefix="/api/items", tags=["Items"])


@router.get("/", response_model=PaginatedItems)
def list_active_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_active_items(db, page, page_size)
