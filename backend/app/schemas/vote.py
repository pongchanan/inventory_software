from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


VoteCategory = Literal["equipment", "board_game"]


class VoteProposalCreate(BaseModel):
    category: VoteCategory
    title: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)


class VoteProposalOut(BaseModel):
    id: int
    category: VoteCategory
    title: str
    description: str | None
    image_url: str | None
    created_at: datetime
    is_active: bool
    has_voted: bool = False


class VoteProposalStatusUpdate(BaseModel):
    is_active: bool


class VoteCycleOut(BaseModel):
    id: int
    week_start: date

    model_config = {"from_attributes": True}


class VoteResultOut(VoteProposalOut):
    vote_count: int
