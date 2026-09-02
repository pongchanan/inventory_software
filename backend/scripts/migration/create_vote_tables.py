"""Create the tables used by the weekly vote system.

Run once before deploying the vote feature. The operation is idempotent and
does not alter existing inventory, users, or locker assignments.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import Base, engine
import app.models  # noqa: F401 - register the referenced users table
from app.models.proposal_vote import ProposalVote
from app.models.vote_cycle import VoteCycle
from app.models.vote_proposal import VoteProposal


def main() -> None:
    Base.metadata.create_all(
        bind=engine,
        tables=[VoteCycle.__table__, VoteProposal.__table__, ProposalVote.__table__],
    )
    print("Vote tables are ready.")


if __name__ == "__main__":
    main()
