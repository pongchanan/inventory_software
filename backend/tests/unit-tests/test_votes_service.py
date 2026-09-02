from datetime import date, datetime
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401
from app.database import Base
from app.models.user import User
from app.models.vote_proposal import VoteProposal
from app.services import votes_service
from app.services.votes_service import proposal_out


def test_public_proposal_payload_hides_vote_count():
    proposal = SimpleNamespace(
        id=1,
        category="equipment",
        title="Oscilloscope",
        description="For the electronics lab",
        created_at=datetime(2026, 9, 2, 12, 0),
        is_active=True,
    )

    payload = proposal_out(proposal, has_voted=True)

    assert payload["has_voted"] is True
    assert payload["image_url"] is None
    assert "vote_count" not in payload


def test_public_proposal_payload_includes_a_presigned_image_url(monkeypatch):
    proposal = SimpleNamespace(
        id=1,
        category="equipment",
        title="Oscilloscope",
        description=None,
        image_path="vote-proposals/1/cover.jpg",
        created_at=datetime(2026, 9, 2, 12, 0),
        is_active=True,
    )
    monkeypatch.setattr(votes_service, "get_presigned_url", lambda key: f"https://images.test/{key}")

    payload = proposal_out(proposal)

    assert payload["image_url"] == "https://images.test/vote-proposals/1/cover.jpg"


@pytest.fixture
def vote_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    session.add_all([
        User(name="One", email="one@example.com", password_hash="x"),
        User(name="Two", email="two@example.com", password_hash="x"),
    ])
    session.commit()
    yield session
    session.close()


def test_creator_is_automatically_recorded_as_a_voter(vote_db, monkeypatch):
    monkeypatch.setattr(votes_service, "current_week_start", lambda: date(2026, 8, 31))
    user = vote_db.query(User).filter(User.email == "one@example.com").one()

    proposal = votes_service.create_proposal(
        vote_db, user, "equipment", "Oscilloscope", "For the electronics lab"
    )

    assert proposal["has_voted"] is True
    public_items = votes_service.list_public_proposals(vote_db, user)
    assert public_items == [proposal]
    assert "vote_count" not in public_items[0]


def test_same_user_cannot_vote_for_one_choice_twice_in_a_week(vote_db, monkeypatch):
    monkeypatch.setattr(votes_service, "current_week_start", lambda: date(2026, 8, 31))
    creator, voter = vote_db.query(User).order_by(User.id).all()
    proposal = VoteProposal(category="board_game", title="Catan", created_by=creator.id)
    vote_db.add(proposal)
    vote_db.commit()

    votes_service.vote_for_proposal(vote_db, proposal.id, voter)
    with pytest.raises(ValueError, match="already voted"):
        votes_service.vote_for_proposal(vote_db, proposal.id, voter)


def test_a_new_week_allows_a_fresh_vote(vote_db, monkeypatch):
    creator, voter = vote_db.query(User).order_by(User.id).all()
    proposal = VoteProposal(category="equipment", title="3D Printer", created_by=creator.id)
    vote_db.add(proposal)
    vote_db.commit()

    monkeypatch.setattr(votes_service, "current_week_start", lambda: date(2026, 8, 31))
    votes_service.vote_for_proposal(vote_db, proposal.id, voter)
    monkeypatch.setattr(votes_service, "current_week_start", lambda: date(2026, 9, 7))

    assert votes_service.vote_for_proposal(vote_db, proposal.id, voter)["has_voted"] is True
