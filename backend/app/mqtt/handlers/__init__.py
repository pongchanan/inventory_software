from app.mqtt.handlers.open_cabinet import handle_open_cabinet
from app.mqtt.handlers.close_cabinet import handle_close_cabinet
from app.mqtt.handlers.register_card import handle_register_card_scan

# Map sub-topic → handler function.
# The key is matched against the part after the base topic.
# e.g. "inventory/iot/open-cabinet" → key = "open-cabinet"
HANDLER_MAP: dict[str, callable] = {
    "open-cabinet": handle_open_cabinet,
    "close-cabinet": handle_close_cabinet,
    "register-card-scan": handle_register_card_scan,
}
