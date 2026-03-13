"""Smoke tests for MQTT handler payload validation."""

from app import mqtt_handlers


def test_route_unknown_topic_does_not_crash():
    mqtt_handlers.route("kiosk/unknown", "{}")


def test_open_cabinet_missing_uid_returns_error(monkeypatch):
    published = []

    def fake_publish(data):
        published.append(data)

    monkeypatch.setattr(mqtt_handlers, "publish_response", fake_publish)

    mqtt_handlers.open_cabinet("kiosk/open_cabinet", '{"kiosk_id":"kiosk_main_01"}')

    assert published
    assert published[-1]["status"] == "error"


def test_register_card_invalid_json_returns_error(monkeypatch):
    published = []

    def fake_publish(data):
        published.append(data)

    monkeypatch.setattr(mqtt_handlers, "publish_response", fake_publish)

    mqtt_handlers.register_card("kiosk/register_card", "not-json")

    assert published
    assert published[-1]["status"] == "error"


def test_session_event_missing_required_fields(monkeypatch):
    published = []

    def fake_publish(data):
        published.append(data)

    monkeypatch.setattr(mqtt_handlers, "publish_response", fake_publish)

    mqtt_handlers.handle_session_event("kiosk/session_event", '{"kiosk_id":"kiosk_main_01"}')

    assert published
    assert published[-1]["status"] == "error"
