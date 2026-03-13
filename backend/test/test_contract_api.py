"""Contract tests for canonical storage/session/inventory APIs."""


def test_storage_unit_location_session_event_flow(client, regular_user):
    # Create unit
    unit_res = client.post(
        "/api/storage/units",
        json={"unit_type": "drawer", "layout_type": "grid"},
    )
    assert unit_res.status_code == 201
    unit_id = unit_res.json()["id"]

    # Create location
    loc_res = client.post(
        "/api/storage/locations",
        json={"unit_id": unit_id, "level_no": 0, "row_no": 0, "col_no": 1},
    )
    assert loc_res.status_code == 201
    location_id = loc_res.json()["id"]

    # Create item type
    item_res = client.post("/api/item-types", json={"name": "ESP32"})
    assert item_res.status_code == 201
    item_type_id = item_res.json()["id"]

    # Open session
    session_res = client.post(
        "/api/sessions",
        json={"user_id": regular_user.id, "unit_id": unit_id},
    )
    assert session_res.status_code == 201
    session_id = session_res.json()["id"]

    # Create inventory event
    event_res = client.post(
        "/api/inventory/events",
        json={
            "session_id": session_id,
            "user_id": regular_user.id,
            "item_type_id": item_type_id,
            "event_type": "borrow",
            "quantity": 1,
            "location_id": location_id,
        },
    )
    assert event_res.status_code == 201

    # Occupancy endpoint available
    occ_res = client.get(f"/api/inventory/occupancy/location/{location_id}")
    assert occ_res.status_code == 200
    assert occ_res.json()["location_id"] == location_id

    # Close session
    close_res = client.post(f"/api/sessions/{session_id}/close")
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "closed"
