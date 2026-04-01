import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException

from app.services.users_service import get_all_users, get_user_by_id, update_user


class TestGetAllUsers:
    def test_returns_list(self, mock_db, sample_user):
        mock_db.query.return_value.order_by.return_value.all.return_value = [
            sample_user
        ]

        result = get_all_users(mock_db)
        assert len(result) == 1
        assert result[0] == sample_user

    def test_empty(self, mock_db):
        result = get_all_users(mock_db)
        assert result == []


class TestGetUserById:
    def test_found(self, mock_db, sample_user):
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        result = get_user_by_id(mock_db, 1)
        assert result == sample_user

    def test_not_found(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(HTTPException) as exc:
            get_user_by_id(mock_db, 999)
        assert exc.value.status_code == 404


class TestUpdateUser:
    def test_update_name(self, mock_db, sample_user):
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        result = update_user(mock_db, 1, {"name": "Updated"})
        assert sample_user.name == "Updated"
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    def test_update_multiple_fields(self, mock_db, sample_user):
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        update_user(mock_db, 1, {"name": "New Name", "is_blacklist": True})
        assert sample_user.name == "New Name"
        assert sample_user.is_blacklist is True

    def test_skip_none_values(self, mock_db, sample_user):
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user
        original_name = sample_user.name

        update_user(mock_db, 1, {"name": None, "email": "new@example.com"})
        assert sample_user.name == original_name
        assert sample_user.email == "new@example.com"

    def test_not_found(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(HTTPException) as exc:
            update_user(mock_db, 999, {"name": "X"})
        assert exc.value.status_code == 404
