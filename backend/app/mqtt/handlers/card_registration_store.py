"""In-memory store for pending card-registration requests.

When a user triggers "register card now", the backend stores the user_id here
and publishes an MQTT message to the IoT device.  When the IoT device scans
a card and publishes back, the handler looks up the pending user_id from this
store and links the card.
"""

import threading

_pending_user_id: int | None = None
_event = threading.Event()
_result_card_id: str | None = None
_lock = threading.Lock()


def set_pending_user(user_id: int):
    global _pending_user_id, _result_card_id
    with _lock:
        _pending_user_id = user_id
        _result_card_id = None
        _event.clear()


def get_pending_user() -> int | None:
    with _lock:
        return _pending_user_id


def resolve_pending(card_id: str):
    """Called by the MQTT handler when the IoT device sends the scanned card."""
    global _result_card_id
    with _lock:
        _result_card_id = card_id
        _event.set()


def wait_for_card(timeout: float = 15.0) -> str | None:
    """Block until the IoT device scans a card or timeout expires.
    Returns the card_id or None on timeout."""
    _event.wait(timeout=timeout)
    with _lock:
        return _result_card_id


def clear_pending():
    global _pending_user_id, _result_card_id
    with _lock:
        _pending_user_id = None
        _result_card_id = None
        _event.clear()
