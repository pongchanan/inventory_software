from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.activity_log import ActivityLogEntry
from app.services.activity_log_service import get_activity_log
from app.services.auth_service import require_admin

router = APIRouter(prefix="/api/activity-log", tags=["Activity Log"])


@router.get(
    "/",
    response_model=list[ActivityLogEntry],
    dependencies=[Depends(require_admin)],
)
def list_activity_log(db: Session = Depends(get_db)):
    return get_activity_log(db)
