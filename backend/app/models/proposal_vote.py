from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ProposalVote(Base):
    __tablename__ = "proposal_votes"
    __table_args__ = (
        UniqueConstraint(
            "cycle_id", "proposal_id", "user_id", name="uq_proposal_votes_cycle_proposal_user"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cycle_id: Mapped[int] = mapped_column(Integer, ForeignKey("vote_cycles.id"), nullable=False)
    proposal_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("vote_proposals.id"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
