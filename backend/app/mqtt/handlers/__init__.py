from app.mqtt.handlers.open_cabinet import handle_open_cabinet

# Map sub-topic → handler function.
# The key is matched against the part after the base topic.
# e.g. "inventory/iot/open-cabinet" → key = "open-cabinet"
HANDLER_MAP: dict[str, callable] = {
    "open-cabinet": handle_open_cabinet,
}
