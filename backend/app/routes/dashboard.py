from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import require_admin
from app.services.dashboard_service import get_dashboard_stats, get_most_damaged_items

router = APIRouter(prefix="/api/admin/dashboard", tags=["Admin API"])


@router.get("/stats", dependencies=[Depends(require_admin)])
def dashboard_stats(db: Session = Depends(get_db)):
    return get_dashboard_stats(db)


@router.get("/most-damaged", dependencies=[Depends(require_admin)])
def most_damaged(limit: int = 5, db: Session = Depends(get_db)):
    return get_most_damaged_items(db, limit)
