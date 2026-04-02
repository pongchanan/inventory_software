"""In-memory store for the active cabinet session.

Only one session can be active at a time.
Open sets it, close pops it.
"""

_active_session_id: int | None = None


def set_active_session(session_id: int):
    global _active_session_id
    _active_session_id = session_id


def pop_active_session() -> int | None:
    global _active_session_id
    sid = _active_session_id
    _active_session_id = None
    return sid
