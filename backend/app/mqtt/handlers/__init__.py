from app.mqtt.handlers.open_cabinet import handle_open_cabinet
from app.mqtt.handlers.close_cabinet import handle_close_cabinet
from app.mqtt.handlers.register_card import handle_register_card_scan

# Map sub-topic → handler function.
# The key is matched against the part after the base topic.
# e.g. "cabinet/access/request" → key = "access/request"
HANDLER_MAP: dict[str, callable] = {
    "access/request": handle_open_cabinet,
    "door/closed": handle_close_cabinet,
    "card/scanned": handle_register_card_scan,
}
