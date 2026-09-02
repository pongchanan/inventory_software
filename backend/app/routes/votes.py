from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.vote import (
    VoteCycleOut,
    VoteCategory,
    VoteProposalOut,
    VoteProposalStatusUpdate,
    VoteResultOut,
)
from app.services.auth_service import (
    get_current_user,
    get_optional_current_user,
    require_admin,
)
from app.services.votes_service import (
    create_proposal,
    cycle_results,
    list_cycles,
    list_public_proposals,
    remove_vote,
    set_proposal_status,
    vote_for_proposal,
)


router = APIRouter(prefix="/api/votes")


@router.get("/proposals", response_model=list[VoteProposalOut], tags=["General"])
def proposals(
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    return list_public_proposals(db, current_user)


@router.post(
    "/proposals",
    response_model=VoteProposalOut,
    status_code=status.HTTP_201_CREATED,
    tags=["User API"],
)
async def add_proposal(
    category: VoteCategory = Form(...),
    title: str = Form(..., min_length=2, max_length=120),
    description: str | None = Form(None, max_length=500),
    image: UploadFile | None = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    image_bytes = await image.read() if image else None
    if image and not image_bytes:
        raise HTTPException(status_code=400, detail="image file is empty")
    return create_proposal(
        db,
        current_user,
        category,
        title,
        description,
        image_bytes,
        (image.content_type or "image/jpeg") if image else "image/jpeg",
    )


@router.post("/proposals/{proposal_id}/vote", response_model=VoteProposalOut, tags=["User API"])
def vote(
    proposal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return vote_for_proposal(db, proposal_id, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.delete("/proposals/{proposal_id}/vote", status_code=status.HTTP_204_NO_CONTENT, tags=["User API"])
def unvote(
    proposal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        remove_vote(db, proposal_id, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get(
    "/admin/cycles",
    response_model=list[VoteCycleOut],
    dependencies=[Depends(require_admin)],
    tags=["Admin API"],
)
def admin_cycles(db: Session = Depends(get_db)):
    return list_cycles(db)


@router.get(
    "/admin/cycles/{cycle_id}/results",
    response_model=list[VoteResultOut],
    dependencies=[Depends(require_admin)],
    tags=["Admin API"],
)
def admin_cycle_results(cycle_id: int, db: Session = Depends(get_db)):
    try:
        return cycle_results(db, cycle_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.patch(
    "/admin/proposals/{proposal_id}",
    response_model=VoteProposalOut,
    dependencies=[Depends(require_admin)],
    tags=["Admin API"],
)
def update_proposal_status(
    proposal_id: int,
    body: VoteProposalStatusUpdate,
    db: Session = Depends(get_db),
):
    try:
        return set_proposal_status(db, proposal_id, body.is_active)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
