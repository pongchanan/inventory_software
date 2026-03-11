from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.drawer import Drawer
from app.models.drawer_session import DrawerSession
from app.models.drawer_slot import DrawerSlot
from app.models.slot_occupancy import SlotOccupancy
from app.schemas.drawer import DrawerResponse
from app.schemas.drawer_session import DrawerSessionResponse
from app.schemas.drawer_slot import DrawerSlotResponse


router = APIRouter(prefix="/api/drawers", tags=["drawers"])


class DrawerSessionStartRequest(BaseModel):
    user_uid: str
    baseline_snapshot_id: Optional[int] = None


class DrawerSessionCloseRequest(BaseModel):
    session_id: Optional[int] = None
    user_uid: Optional[str] = None
    status: str = "processing"
    increment_close_attempt: bool = True


class DrawerOccupancyResponse(BaseModel):
    slot_id: int
    slot_code: str
    row_index: int
    col_index: int
    is_tracked: bool
    occupancy_id: Optional[int] = None
    snapshot_id: Optional[int] = None
    state: str = "unknown"
    item_type_id: Optional[int] = None
    confidence: Optional[float] = None
    updated_at: Optional[datetime] = None


@router.get("", response_model=List[DrawerResponse])
@router.get("/", response_model=List[DrawerResponse])
def list_drawers(
    floor: Optional[int] = None,
    cabinet_code: Optional[str] = None,
    status_filter: Optional[str] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
):
    """GET /api/drawers

    List drawers with optional filtering for floor/cabinet/status.
    """
    query = db.query(Drawer)

    if floor is not None:
        query = query.filter(Drawer.floor == floor)
    if cabinet_code:
        query = query.filter(Drawer.cabinet_code == cabinet_code)
    if status_filter:
        query = query.filter(Drawer.status == status_filter)
    if active_only:
        query = query.filter(Drawer.is_active.is_(True))

    return query.order_by(Drawer.cabinet_code, Drawer.floor, Drawer.drawer_code).all()


@router.get("/{drawer_id}", response_model=DrawerResponse)
def get_drawer(drawer_id: int, db: Session = Depends(get_db)):
    """GET /api/drawers/{id}

    Return one drawer by numeric id.
    """
    drawer = db.query(Drawer).filter(Drawer.id == drawer_id).first()
    if not drawer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Drawer {drawer_id} not found",
        )
    return drawer


@router.get("/{drawer_id}/slots", response_model=List[DrawerSlotResponse])
def get_drawer_slots(drawer_id: int, db: Session = Depends(get_db)):
    """GET /api/drawers/{id}/slots

    Return all slots for a drawer, ordered by row/column.
    """
    drawer = db.query(Drawer).filter(Drawer.id == drawer_id).first()
    if not drawer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Drawer {drawer_id} not found",
        )

    return (
        db.query(DrawerSlot)
        .filter(DrawerSlot.drawer_id == drawer_id)
        .order_by(DrawerSlot.row_index, DrawerSlot.col_index)
        .all()
    )


@router.get("/{drawer_id}/occupancy", response_model=List[DrawerOccupancyResponse])
def get_drawer_occupancy(drawer_id: int, db: Session = Depends(get_db)):
    """GET /api/drawers/{id}/occupancy

    Return occupancy state for every slot in the drawer.
    If no occupancy record exists for a slot yet, returns state='unknown'.
    """
    drawer = db.query(Drawer).filter(Drawer.id == drawer_id).first()
    if not drawer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Drawer {drawer_id} not found",
        )

    slots = (
        db.query(DrawerSlot)
        .filter(DrawerSlot.drawer_id == drawer_id)
        .order_by(DrawerSlot.row_index, DrawerSlot.col_index)
        .all()
    )

    occupancies = (
        db.query(SlotOccupancy)
        .join(DrawerSlot, DrawerSlot.id == SlotOccupancy.slot_id)
        .filter(DrawerSlot.drawer_id == drawer_id)
        .all()
    )
    occupancy_by_slot = {occ.slot_id: occ for occ in occupancies}

    response: List[DrawerOccupancyResponse] = []
    for slot in slots:
        occ = occupancy_by_slot.get(slot.id)
        response.append(
            DrawerOccupancyResponse(
                slot_id=slot.id,
                slot_code=slot.slot_code,
                row_index=slot.row_index,
                col_index=slot.col_index,
                is_tracked=slot.is_tracked,
                occupancy_id=occ.id if occ else None,
                snapshot_id=occ.snapshot_id if occ else None,
                state=occ.state if occ else "unknown",
                item_type_id=occ.item_type_id if occ else None,
                confidence=occ.confidence if occ else None,
                updated_at=occ.updated_at if occ else None,
            )
        )

    return response


@router.post(
    "/{drawer_id}/session/start",
    response_model=DrawerSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_drawer_session(
    drawer_id: int,
    payload: DrawerSessionStartRequest,
    db: Session = Depends(get_db),
):
    """POST /api/drawers/{id}/session/start

    Start a new drawer session for a user after successful authentication.
    """
    drawer = db.query(Drawer).filter(Drawer.id == drawer_id).first()
    if not drawer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Drawer {drawer_id} not found",
        )

    if not drawer.is_active or drawer.status == "disabled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Drawer {drawer.drawer_code} is not available",
        )

    # Keep flow deterministic: only one open/processing session per drawer.
    existing = (
        db.query(DrawerSession)
        .filter(
            DrawerSession.drawer_id == drawer_id,
            DrawerSession.status.in_(["open", "processing"]),
        )
        .order_by(DrawerSession.started_at.desc())
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Drawer {drawer.drawer_code} already has an active session "
                f"(session_id={existing.id}, status={existing.status})"
            ),
        )

    session = DrawerSession(
        drawer_id=drawer_id,
        user_uid=payload.user_uid,
        status="open",
        baseline_snapshot_id=payload.baseline_snapshot_id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/{drawer_id}/session/close", response_model=DrawerSessionResponse)
def close_drawer_session(
    drawer_id: int,
    payload: DrawerSessionCloseRequest,
    db: Session = Depends(get_db),
):
    """POST /api/drawers/{id}/session/close

    Close the current session for a drawer and move it to processing/completed/etc.
    Caller can provide a specific session_id, otherwise latest open/processing
    session is selected (optionally filtered by user_uid).
    """
    drawer = db.query(Drawer).filter(Drawer.id == drawer_id).first()
    if not drawer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Drawer {drawer_id} not found",
        )

    query = db.query(DrawerSession).filter(DrawerSession.drawer_id == drawer_id)

    if payload.session_id is not None:
        query = query.filter(DrawerSession.id == payload.session_id)
    else:
        query = query.filter(DrawerSession.status.in_(["open", "processing"]))

    if payload.user_uid:
        query = query.filter(DrawerSession.user_uid == payload.user_uid)

    session = query.order_by(DrawerSession.started_at.desc()).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No matching drawer session found to close",
        )

    session.closed_at = datetime.utcnow()
    session.status = payload.status
    if payload.increment_close_attempt:
        session.close_attempt_count = (session.close_attempt_count or 0) + 1

    db.commit()
    db.refresh(session)
    return session
