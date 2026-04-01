import pytest
from unittest.mock import MagicMock, patch, call
from fastapi import HTTPException

from app.services.registration_service import (
    create_registration,
    complete_registration,
    get_registration_by_credentials,
    register_with_card,
)


class TestCreateRegistration:
    def test_success(self, mock_db):
        reg = create_registration(mock_db, "New User", "new@example.com", "pass123")
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    def test_email_already_user(self, mock_db, sample_user):
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        with pytest.raises(HTTPException) as exc:
            create_registration(mock_db, "Dup", "test@example.com", "pass")
        assert exc.value.status_code == 409
        assert "already registered" in exc.value.detail.lower()

    def test_email_already_pending(self, mock_db, sample_registration):
        # First query (User) returns None, second query (Registration) returns existing
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            None,
            sample_registration,
        ]

        with pytest.raises(HTTPException) as exc:
            create_registration(mock_db, "Dup", "pending@example.com", "pass")
        assert exc.value.status_code == 409
        assert "pending" in exc.value.detail.lower()


class TestCompleteRegistration:
    def test_success(self, mock_db, sample_registration):
        # First call: find registration, second call: check card_id
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            sample_registration,
            None,
        ]

        result = complete_registration(mock_db, 1, "CARD_NEW")
        mock_db.add.assert_called_once()
        mock_db.delete.assert_called_once_with(sample_registration)
        mock_db.commit.assert_called_once()

    def test_registration_not_found(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(HTTPException) as exc:
            complete_registration(mock_db, 999, "CARD")
        assert exc.value.status_code == 404

    def test_card_already_taken(self, mock_db, sample_registration, sample_user):
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            sample_registration,
            sample_user,
        ]

        with pytest.raises(HTTPException) as exc:
            complete_registration(mock_db, 1, "CARD001")
        assert exc.value.status_code == 409
        assert "card" in exc.value.detail.lower()


class TestGetRegistrationByCredentials:
    @patch("app.services.auth_service.verify_password", return_value=True)
    def test_valid_credentials(self, mock_verify, mock_db, sample_registration):
        mock_db.query.return_value.filter.return_value.first.return_value = (
            sample_registration
        )

        result = get_registration_by_credentials(mock_db, "pending@example.com", "pass")
        assert result == sample_registration

    def test_not_found(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(HTTPException) as exc:
            get_registration_by_credentials(mock_db, "no@example.com", "pass")
        assert exc.value.status_code == 401

    @patch("app.services.auth_service.verify_password", return_value=False)
    def test_wrong_password(self, mock_verify, mock_db, sample_registration):
        mock_db.query.return_value.filter.return_value.first.return_value = (
            sample_registration
        )

        with pytest.raises(HTTPException) as exc:
            get_registration_by_credentials(mock_db, "pending@example.com", "wrong")
        assert exc.value.status_code == 401


class TestRegisterWithCard:
    def test_success(self, mock_db):
        # email check None, card check None, pending check None
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            None,
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
