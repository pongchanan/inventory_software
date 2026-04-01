import pytest
from unittest.mock import MagicMock, patch, call
from fastapi import HTTPException

from app.services.registration_service import (
    create_registration,
    register_with_card,
)


class TestCreateRegistration:
    def test_success(self, mock_db):
        user = create_registration(mock_db, "New User", "new@example.com", "pass123")
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    def test_email_already_exists(self, mock_db, sample_user):
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        with pytest.raises(HTTPException) as exc:
            create_registration(mock_db, "Dup", "test@example.com", "pass")
        assert exc.value.status_code == 409
        assert "already registered" in exc.value.detail.lower()


class TestRegisterWithCard:
    def test_success(self, mock_db):
        # email check None, card check None
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            None,
            None,
        ]

        result = register_with_card(
            mock_db, "Direct", "direct@example.com", "pass", "CARD_X"
        )
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_email_exists(self, mock_db, sample_user):
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        with pytest.raises(HTTPException) as exc:
            register_with_card(mock_db, "Dup", "test@example.com", "pass", "CARD_X")
        assert exc.value.status_code == 409

    def test_card_taken(self, mock_db, sample_user):
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            None,
            sample_user,
        ]

        with pytest.raises(HTTPException) as exc:
            register_with_card(mock_db, "New", "new@example.com", "pass", "CARD001")
        assert exc.value.status_code == 409
