"""Tests for canonical users API."""

from app.models.user import User


class TestUserModel:
    def test_create_user(self, db_session):
        user = User(
            nfc_card_uid="CARD100",
            name="Model User",
            email="model.user@test.com",
            role="user",
            active=True,
        )
        db_session.add(user)
        db_session.commit()

        assert user.id is not None
        assert user.nfc_card_uid == "CARD100"
        assert user.active is True


class TestUsersEndpoints:
    def test_create_user(self, client):
        response = client.post(
            "/api/users",
            json={
                "nfc_card_uid": "CARD200",
                "name": "Alice",
                "email": "alice@test.com",
                "password": "secret123",
                "role": "user",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["nfc_card_uid"] == "CARD200"
        assert data["name"] == "Alice"

    def test_create_user_duplicate_card_uid(self, client):
        payload = {
            "nfc_card_uid": "CARD201",
            "name": "Bob",
            "email": "bob@test.com",
            "password": "secret123",
            "role": "user",
        }
        first = client.post("/api/users", json=payload)
        second = client.post("/api/users", json={**payload, "email": "bob2@test.com"})

        assert first.status_code == 201
        assert second.status_code == 400

    def test_list_users(self, client, regular_user):
        response = client.get("/api/users")
        assert response.status_code == 200
        data = response.json()
        assert any(row["id"] == regular_user.id for row in data)

    def test_get_user_by_id(self, client, regular_user):
        response = client.get(f"/api/users/{regular_user.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == regular_user.id
        assert data["nfc_card_uid"] == regular_user.nfc_card_uid

    def test_get_user_by_nfc(self, client, regular_user):
        response = client.get(f"/api/users/by-nfc/{regular_user.nfc_card_uid}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == regular_user.id

    def test_patch_user(self, client, regular_user):
        response = client.patch(
            f"/api/users/{regular_user.id}",
            json={"name": "Updated Name", "active": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["active"] is False

    def test_delete_user(self, client):
        created = client.post(
            "/api/users",
            json={
                "nfc_card_uid": "CARD_DELETE",
                "name": "To Delete",
                "email": "delete@test.com",
                "password": "secret123",
                "role": "user",
            },
        )
        assert created.status_code == 201
        user_id = created.json()["id"]

        deleted = client.delete(f"/api/users/{user_id}")
        assert deleted.status_code == 204

        check = client.get(f"/api/users/{user_id}")
        assert check.status_code == 404
