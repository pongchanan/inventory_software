import pytest
from unittest.mock import MagicMock, patch, call
from datetime import datetime, timedelta

from app.services.due_date_checker import _check_due_dates


class TestCheckDueDates:
    def _make_borrowing(self, due_at, return_at=None):
        b = MagicMock()
        b.due_at = due_at
        b.return_at = return_at
        return b

    def _make_user(self, email="user@example.com", name="Test User"):
        u = MagicMock()
        u.email = email
        u.name = name
        return u

    def _make_item(self, name="Screwdriver"):
        i = MagicMock()
        i.name = name
        return i

    @patch("app.services.due_date_checker.send_email")
    @patch("app.services.due_date_checker.SessionLocal")
    def test_overdue_sends_email(self, mock_session_cls, mock_send):
        db = MagicMock()
        mock_session_cls.return_value = db

        now = datetime.utcnow()
        borrowing = self._make_borrowing(due_at=now - timedelta(days=2))
        user = self._make_user()
        item = self._make_item()

        db.query.return_value.join.return_value.join.return_value.filter.return_value.all.return_value = [
            (borrowing, user, item)
        ]

        _check_due_dates()

        mock_send.assert_called_once()
        args = mock_send.call_args
        assert args.kwargs["to"] == "user@example.com"
        assert "OVERDUE" in args.kwargs["subject"]

    @patch("app.services.due_date_checker.send_email")
    @patch("app.services.due_date_checker.SessionLocal")
    def test_due_tomorrow_sends_warning(self, mock_session_cls, mock_send):
        db = MagicMock()
        mock_session_cls.return_value = db

        now = datetime.utcnow()
        borrowing = self._make_borrowing(due_at=now + timedelta(hours=12))
        user = self._make_user()
        item = self._make_item()

        db.query.return_value.join.return_value.join.return_value.filter.return_value.all.return_value = [
            (borrowing, user, item)
        ]

        _check_due_dates()

        mock_send.assert_called_once()
        args = mock_send.call_args
        assert "Reminder" in args.kwargs["subject"]

    @patch("app.services.due_date_checker.send_email")
    @patch("app.services.due_date_checker.SessionLocal")
    def test_not_due_yet_no_email(self, mock_session_cls, mock_send):
        db = MagicMock()
        mock_session_cls.return_value = db

        now = datetime.utcnow()
        borrowing = self._make_borrowing(due_at=now + timedelta(days=5))
        user = self._make_user()
        item = self._make_item()

        db.query.return_value.join.return_value.join.return_value.filter.return_value.all.return_value = [
            (borrowing, user, item)
        ]

        _check_due_dates()

        mock_send.assert_not_called()

    @patch("app.services.due_date_checker.send_email")
    @patch("app.services.due_date_checker.SessionLocal")
    def test_no_active_borrowings(self, mock_session_cls, mock_send):
        db = MagicMock()
        mock_session_cls.return_value = db

        db.query.return_value.join.return_value.join.return_value.filter.return_value.all.return_value = (
            []
        )

        _check_due_dates()

        mock_send.assert_not_called()

    @patch("app.services.due_date_checker.send_email")
    @patch("app.services.due_date_checker.SessionLocal")
    def test_multiple_borrowings_mixed(self, mock_session_cls, mock_send):
        db = MagicMock()
        mock_session_cls.return_value = db

        now = datetime.utcnow()

        overdue_b = self._make_borrowing(due_at=now - timedelta(days=1))
        overdue_user = self._make_user(email="late@example.com")
        overdue_item = self._make_item(name="Hammer")

        warning_b = self._make_borrowing(due_at=now + timedelta(hours=6))
        warning_user = self._make_user(email="soon@example.com")
        warning_item = self._make_item(name="Drill")

        safe_b = self._make_borrowing(due_at=now + timedelta(days=7))
        safe_user = self._make_user(email="safe@example.com")
        safe_item = self._make_item(name="Wrench")

        db.query.return_value.join.return_value.join.return_value.filter.return_value.all.return_value = [
            (overdue_b, overdue_user, overdue_item),
            (warning_b, warning_user, warning_item),
            (safe_b, safe_user, safe_item),
        ]

        _check_due_dates()

        assert mock_send.call_count == 2
        subjects = [c.kwargs["subject"] for c in mock_send.call_args_list]
        assert any("OVERDUE" in s for s in subjects)
        assert any("Reminder" in s for s in subjects)

    @patch("app.services.due_date_checker.send_email")
    @patch("app.services.due_date_checker.SessionLocal")
    def test_db_closed_after_check(self, mock_session_cls, mock_send):
        db = MagicMock()
        mock_session_cls.return_value = db

        db.query.return_value.join.return_value.join.return_value.filter.return_value.all.return_value = (
            []
        )

        _check_due_dates()

        db.close.assert_called_once()

    @patch("app.services.due_date_checker.send_email")
    @patch("app.services.due_date_checker.SessionLocal")
    def test_db_closed_on_error(self, mock_session_cls, mock_send):
        db = MagicMock()
        mock_session_cls.return_value = db

        db.query.side_effect = Exception("DB error")

        _check_due_dates()

        db.close.assert_called_once()
