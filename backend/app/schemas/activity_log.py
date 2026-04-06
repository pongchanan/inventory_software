from datetime import datetime
from typing import Literal

from pydantic import BaseModel

EventType = Literal[
    "session_open",
    "session_close",
    "borrowing",
    "borrowing_return",
    "damage_report",
    "damage_report_approved",
]


class ActivityLogEntry(BaseModel):
    event_type: EventType
    timestamp: datetime
    reference_id: int  # id of source record (session/borrowing/report)
    user_id: int | None
    user_name: str | None
    item_id: int | None
    item_name: str | None
    detail: str | None  # extra context (admin_comment, close_image flag, etc.)
