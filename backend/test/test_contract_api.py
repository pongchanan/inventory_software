"""Contract tests for canonical `/api/*` endpoint surface."""

from datetime import datetime

import pytest

from app.services import audit_logs_service, auth_service


pytestmark = pytest.mark.contract


def _create_base_contract_data(client, regular_user):
    unit_res = client.post(
        "/api/storage/units",
        json={"unit_type": "drawer", "layout_type": "grid"},
    )
    assert unit_res.status_code == 201
    unit_id = unit_res.json()["id"]

    loc_res = client.post(
        "/api/storage/locations",
        json={"unit_id": unit_id, "level_no": 0, "row_no": 0, "col_no": 1},
    )
    assert loc_res.status_code == 201
    location_id = loc_res.json()["id"]

    item_res = client.post("/api/item-types", json={"name": "ESP32"})
    assert item_res.status_code == 201
    item_type_id = item_res.json()["id"]

    session_res = client.post(
        "/api/sessions",
        json={"user_id": regular_user.id, "unit_id": unit_id},
    )
    assert session_res.status_code == 201
    session_id = session_res.json()["id"]

    return {
        "unit_id": unit_id,
        "location_id": location_id,
        "item_type_id": item_type_id,
        "session_id": session_id,
    }


def test_storage_endpoints_success_and_validation_failure(client, regular_user):
    ids = _create_base_contract_data(client, regular_user)

    get_unit = client.get(f"/api/storage/units/{ids['unit_id']}")
    assert get_unit.status_code == 200
    assert get_unit.json()["id"] == ids["unit_id"]

    patch_unit = client.patch(f"/api/storage/units/{ids['unit_id']}", json={"active": False})
    assert patch_unit.status_code == 200
    assert patch_unit.json()["active"] is False

    list_locations = client.get(f"/api/storage/units/{ids['unit_id']}/locations")
    assert list_locations.status_code == 200
    assert any(loc["id"] == ids["location_id"] for loc in list_locations.json())

    get_location = client.get(f"/api/storage/locations/{ids['location_id']}")
    assert get_location.status_code == 200
    assert get_location.json()["id"] == ids["location_id"]

    bad_create_unit = client.post("/api/storage/units", json={})
    assert bad_create_unit.status_code == 422

    bad_create_location = client.post("/api/storage/locations", json={"level_no": 0})
    assert bad_create_location.status_code == 422

    bad_unit_id = client.get("/api/storage/units/not-an-int")
    assert bad_unit_id.status_code == 422

    delete_location = client.delete(f"/api/storage/locations/{ids['location_id']}")
    assert delete_location.status_code == 204


def test_sessions_endpoints_success_and_validation_failure(client, regular_user):
    ids = _create_base_contract_data(client, regular_user)

    list_sessions = client.get("/api/sessions")
    assert list_sessions.status_code == 200
    assert any(row["id"] == ids["session_id"] for row in list_sessions.json())

    get_session = client.get(f"/api/sessions/{ids['session_id']}")
    assert get_session.status_code == 200
    assert get_session.json()["id"] == ids["session_id"]

    get_active = client.get(f"/api/sessions/user/{regular_user.id}/active")
    assert get_active.status_code == 200
    assert get_active.json()["status"] == "open"

    close_session = client.post(f"/api/sessions/{ids['session_id']}/close")
    assert close_session.status_code == 200
    assert close_session.json()["status"] == "closed"

    bad_open = client.post("/api/sessions", json={"user_id": regular_user.id})
    assert bad_open.status_code == 422

    bad_limit = client.get("/api/sessions?limit=NaN")
    assert bad_limit.status_code == 422


def test_observations_endpoints_success_and_validation_failure(client, regular_user):
    ids = _create_base_contract_data(client, regular_user)

    create_obs = client.post(
        "/api/observations",
        json={
            "session_id": ids["session_id"],
            "location_id": ids["location_id"],
            "source_type": "vision",
            "change_type": "changed",
            "confidence": 0.93,
        },
    )
    assert create_obs.status_code == 201
    observation_id = create_obs.json()["id"]

    list_obs = client.get(f"/api/observations?session_id={ids['session_id']}")
    assert list_obs.status_code == 200
    assert any(row["id"] == observation_id for row in list_obs.json())

    get_obs = client.get(f"/api/observations/{observation_id}")
    assert get_obs.status_code == 200
    assert get_obs.json()["id"] == observation_id

    patch_obs = client.patch(
        f"/api/observations/{observation_id}",
        json={"review_status": "needs_review", "review_note": "manual check"},
    )
    assert patch_obs.status_code == 200
    assert patch_obs.json()["review_status"] == "needs_review"

    needs_review = client.get(f"/api/observations/session/{ids['session_id']}/needs-review")
    assert needs_review.status_code == 200
    assert any(row["id"] == observation_id for row in needs_review.json())

    create_rfid_obs = client.post(
        "/api/observations",
        json={
            "session_id": ids["session_id"],
            "source_type": "rfid",
            "change_type": "changed",
        },
    )
    assert create_rfid_obs.status_code == 201
    rfid_observation_id = create_rfid_obs.json()["id"]

    create_rfid_detail = client.post(
        "/api/observations/rfid-details",
        json={
            "observation_id": rfid_observation_id,
            "tag_uid": "E2000017221101441890ABCD",
            "read_count": 2,
        },
    )
    assert create_rfid_detail.status_code == 201
    assert create_rfid_detail.json()["observation_id"] == rfid_observation_id

    get_rfid_detail = client.get(f"/api/observations/rfid-details/{rfid_observation_id}")
    assert get_rfid_detail.status_code == 200

    create_vision_detail = client.post(
        "/api/observations/vision-details",
        json={
            "observation_id": observation_id,
            "model_version": "v1.0.0",
            "raw_predictions_json": {"label": "esp32", "score": 0.96},
        },
    )
    assert create_vision_detail.status_code == 201
    assert create_vision_detail.json()["observation_id"] == observation_id

    get_vision_detail = client.get(f"/api/observations/vision-details/{observation_id}")
    assert get_vision_detail.status_code == 200

    bad_observation = client.post("/api/observations", json={"source_type": "vision"})
    assert bad_observation.status_code == 422

    bad_rfid_detail = client.post("/api/observations/rfid-details", json={"observation_id": rfid_observation_id})
    assert bad_rfid_detail.status_code == 422

    bad_vision_detail = client.post("/api/observations/vision-details", json={})
    assert bad_vision_detail.status_code == 422


def test_inventory_endpoints_success_and_validation_failure(client, regular_user):
    ids = _create_base_contract_data(client, regular_user)

    create_event = client.post(
        "/api/inventory/events",
        json={
            "session_id": ids["session_id"],
            "user_id": regular_user.id,
            "item_type_id": ids["item_type_id"],
            "event_type": "borrow",
            "quantity": 1,
            "location_id": ids["location_id"],
        },
    )
    assert create_event.status_code == 201
    event_id = create_event.json()["id"]

    list_events = client.get("/api/inventory/events")
    assert list_events.status_code == 200
    assert any(row["id"] == event_id for row in list_events.json())

    get_event = client.get(f"/api/inventory/events/{event_id}")
    assert get_event.status_code == 200
    assert get_event.json()["id"] == event_id

    location_occupancy = client.get(f"/api/inventory/occupancy/location/{ids['location_id']}")
    assert location_occupancy.status_code == 200
    assert location_occupancy.json()["location_id"] == ids["location_id"]

    unit_occupancy = client.get(f"/api/inventory/occupancy/unit/{ids['unit_id']}")
    assert unit_occupancy.status_code == 200
    assert isinstance(unit_occupancy.json(), list)

    bad_create_event = client.post("/api/inventory/events", json={"event_type": "borrow"})
    assert bad_create_event.status_code == 422

    bad_event_id = client.get("/api/inventory/events/not-an-int")
    assert bad_event_id.status_code == 422


def test_audit_log_endpoints_success_and_validation_failure(client, monkeypatch):
    create_log = client.post(
        "/api/audit-logs",
        json={
            "actor_type": "user",
            "actor_id": "USER001",
            "action": "unlock",
            "target_type": "kiosk",
            "target_id": "kiosk-01",
            "result": "success",
            "message": "Drawer opened",
        },
    )
    assert create_log.status_code == 201

    list_logs = client.get("/api/audit-logs")
    assert list_logs.status_code == 200
    assert len(list_logs.json()) >= 1

    recent_logs = client.get("/api/audit-logs/recent")
    assert recent_logs.status_code == 200

    monkeypatch.setattr(
        "app.routes.audit_logs.recent_cabinet_access_logs",
        lambda db, hours, limit: [
            {
                "id": 1,
                "timestamp": datetime.utcnow(),
                "type": "unlock",
                "user": "USER001",
                "user_name": "Test User",
                "item": "drawer-01",
                "status": "success",
                "message": "opened",
                "ip_address": "127.0.0.1",
            }
        ],
    )
    recent_cabinet = client.get("/api/audit-logs/cabinet-access/recent")
    assert recent_cabinet.status_code == 200
    assert recent_cabinet.json()[0]["type"] == "unlock"

    bad_create_log = client.post("/api/audit-logs", json={"actor_type": "user"})
    assert bad_create_log.status_code == 422


def test_kiosk_endpoints_success_and_validation_failure(client):
    auth_service.pending_registrations.clear()
    audit_logs_service.KIOSK_LAST_SEEN.clear()
    audit_logs_service.KIOSK_LAST_SEEN["kiosk-01"] = datetime.utcnow()

    kiosk_list = client.get("/api/kiosk/status")
    assert kiosk_list.status_code == 200
    assert any(row["kiosk_id"] == "kiosk-01" for row in kiosk_list.json())

    kiosk_detail = client.get("/api/kiosk/status/kiosk-01")
    assert kiosk_detail.status_code == 200
    assert kiosk_detail.json()["status"] in {"online", "stale"}

    prepare_registration = client.post(
        "/api/auth/kiosk/prepare_registration",
        json={
            "kiosk_id": "kiosk-02",
            "name": "Kiosk User",
            "email": "kiosk.user@test.com",
            "password": "secret123",
        },
    )
    assert prepare_registration.status_code == 200

    registration_status = client.get("/api/auth/kiosk/status/kiosk-02")
    assert registration_status.status_code == 200
    assert registration_status.json()["status"] == "waiting"

    bad_prepare_registration = client.post(
        "/api/auth/kiosk/prepare_registration",
        json={
            "kiosk_id": "kiosk-03",
            "name": "Missing Password",
            "email": "missing.password@test.com",
        },
    )
    assert bad_prepare_registration.status_code == 422
