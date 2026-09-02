from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.proposal_vote import ProposalVote
from app.models.user import User
from app.models.vote_cycle import VoteCycle
from app.models.vote_proposal import VoteProposal
from app.services.s3_storage import get_presigned_url, upload_vote_proposal_image


THAILAND = timezone(timedelta(hours=7))


def current_week_start() -> date:
    today = datetime.now(THAILAND).date()
    return today - timedelta(days=today.weekday())


def current_cycle(db: Session) -> VoteCycle:
    week_start = current_week_start()
    cycle = db.query(VoteCycle).filter(VoteCycle.week_start == week_start).first()
    if cycle is None:
        cycle = VoteCycle(week_start=week_start)
        db.add(cycle)
        db.flush()
    return cycle


def proposal_out(proposal: VoteProposal, has_voted: bool = False) -> dict:
    image_path = getattr(proposal, "image_path", None)
    return {
        "id": proposal.id,
        "category": proposal.category,
        "title": proposal.title,
        "description": proposal.description,
        "image_url": get_presigned_url(image_path) if image_path else None,
        "created_at": proposal.created_at,
        "is_active": proposal.is_active,
        "has_voted": has_voted,
    }


def list_public_proposals(db: Session, user: User | None = None) -> list[dict]:
    proposals = (
        db.query(VoteProposal)
        .filter(VoteProposal.is_active == True)  # noqa: E712
        .order_by(VoteProposal.created_at.desc())
        .all()
    )
    voted_ids: set[int] = set()
    if user and proposals:
        cycle = current_cycle(db)
        voted_ids = {
            proposal_id
            for (proposal_id,) in (
                db.query(ProposalVote.proposal_id)
                .filter(
                    ProposalVote.cycle_id == cycle.id,
                    ProposalVote.user_id == user.id,
                    ProposalVote.proposal_id.in_([proposal.id for proposal in proposals]),
                )
                .all()
            )
        }
    return [proposal_out(proposal, proposal.id in voted_ids) for proposal in proposals]


def create_proposal(
    db: Session,
    user: User,
    category: str,
    title: str,
    description: str | None,
    image_bytes: bytes | None = None,
    image_content_type: str = "image/jpeg",
) -> dict:
    clean_title = " ".join(title.split())
    clean_description = " ".join(description.split()) if description else None
    proposal = VoteProposal(
        category=category,
        title=clean_title,
        description=clean_description or None,
        created_by=user.id,
    )
    db.add(proposal)
    db.flush()
    if image_bytes:
        proposal.image_path = upload_vote_proposal_image(image_bytes, proposal.id, image_content_type)
    cycle = current_cycle(db)
    db.add(ProposalVote(cycle_id=cycle.id, proposal_id=proposal.id, user_id=user.id))
    db.commit()
    db.refresh(proposal)
    return proposal_out(proposal, has_voted=True)


def vote_for_proposal(db: Session, proposal_id: int, user: User) -> dict:
    proposal = db.query(VoteProposal).filter(VoteProposal.id == proposal_id).first()
    if proposal is None or not proposal.is_active:
        raise ValueError("Vote choice not found or is closed")
    cycle = current_cycle(db)
    db.add(ProposalVote(cycle_id=cycle.id, proposal_id=proposal.id, user_id=user.id))
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise ValueError("You already voted for this choice this week") from error
    return proposal_out(proposal, has_voted=True)


def remove_vote(db: Session, proposal_id: int, user: User) -> None:
    cycle = current_cycle(db)
    vote = (
        db.query(ProposalVote)
        .filter(
            ProposalVote.cycle_id == cycle.id,
            ProposalVote.proposal_id == proposal_id,
            ProposalVote.user_id == user.id,
        )
        .first()
    )
    if vote is None:
        raise ValueError("You have not voted for this choice this week")
    db.delete(vote)
    db.commit()


def list_cycles(db: Session) -> list[VoteCycle]:
    return db.query(VoteCycle).order_by(VoteCycle.week_start.desc()).all()


def cycle_results(db: Session, cycle_id: int) -> list[dict]:
    if db.query(VoteCycle.id).filter(VoteCycle.id == cycle_id).first() is None:
        raise ValueError("Vote cycle not found")
    rows = (
        db.query(VoteProposal, func.count(ProposalVote.id).label("vote_count"))
        .join(
            ProposalVote,
            (ProposalVote.proposal_id == VoteProposal.id)
            & (ProposalVote.cycle_id == cycle_id),
        )
        .group_by(VoteProposal.id)
        .order_by(func.count(ProposalVote.id).desc(), VoteProposal.created_at.desc())
        .all()
    )
    return [
        {**proposal_out(proposal), "vote_count": vote_count}
        for proposal, vote_count in rows
    ]


def set_proposal_status(db: Session, proposal_id: int, is_active: bool) -> dict:
    proposal = db.query(VoteProposal).filter(VoteProposal.id == proposal_id).first()
    if proposal is None:
        raise ValueError("Vote choice not found")
    proposal.is_active = is_active
    db.commit()
    db.refresh(proposal)
    return proposal_out(proposal)
