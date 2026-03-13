"""Tests for item type model and API contract."""

import pytest

from app.models.item_type_core import ItemType


class TestItemTypeModel:
    def test_create_item_type(self, db_session):
        item_type = ItemType(name="NodeMCU", active=True)
        db_session.add(item_type)
        db_session.commit()

        assert item_type.id is not None
        assert item_type.name == "NodeMCU"
        assert item_type.active is True

    def test_item_type_defaults(self, db_session):
        item_type = ItemType(name="Arduino Nano")
        db_session.add(item_type)
        db_session.commit()

        assert item_type.active is True
        assert item_type.created_at is not None
        assert item_type.updated_at is not None


class TestItemTypeEndpoints:
    def test_create_item_type(self, client):
        response = client.post("/api/item-types", json={"name": "ESP32-S3"})
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "ESP32-S3"
        assert data["active"] is True

    def test_get_item_type_by_id(self, client, sample_item_type):
        response = client.get(f"/api/item-types/{sample_item_type.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_item_type.id
        assert data["name"] == sample_item_type.name

    def test_get_item_type_not_found(self, client):
        response = client.get("/api/item-types/99999")
        assert response.status_code == 404

    def test_list_item_types(self, client, db_session):
        db_session.add_all([
            ItemType(name="Type A"),
            ItemType(name="Type B"),
            ItemType(name="Type C"),
        ])
        db_session.commit()

        response = client.get("/api/item-types")
        assert response.status_code == 200
        data = response.json()
        names = [row["name"] for row in data]
        assert "Type A" in names
        assert "Type B" in names
        assert "Type C" in names

    def test_update_item_type(self, client, sample_item_type):
        response = client.patch(
            f"/api/item-types/{sample_item_type.id}",
            json={"name": "Updated Name", "active": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["active"] is False

    def test_delete_item_type(self, client, sample_item_type):
        response = client.delete(f"/api/item-types/{sample_item_type.id}")
        assert response.status_code == 204

        response = client.get(f"/api/item-types/{sample_item_type.id}")
        assert response.status_code == 404

    def test_pagination(self, client, db_session):
        for i in range(8):
            db_session.add(ItemType(name=f"Type {i}"))
        db_session.commit()

        first = client.get("/api/item-types?skip=0&limit=3")
        second = client.get("/api/item-types?skip=3&limit=3")

        assert first.status_code == 200
        assert second.status_code == 200
        assert len(first.json()) == 3
        assert len(second.json()) == 3

    def test_create_item_type_invalid_payload(self, client):
        response = client.post("/api/item-types", json={})
        assert response.status_code == 422

    def test_unique_name_not_enforced_by_db(self, client):
        # Current schema allows same names; this test documents current behavior.
        r1 = client.post("/api/item-types", json={"name": "Duplicated"})
        r2 = client.post("/api/item-types", json={"name": "Duplicated"})

        assert r1.status_code == 201
        assert r2.status_code == 201


@pytest.mark.unit
class TestInventoryContractSurface:
    def test_create_inventory_event_requires_required_fields(self, client):
        response = client.post("/api/inventory/events", json={"event_type": "borrow"})
        assert response.status_code == 422
