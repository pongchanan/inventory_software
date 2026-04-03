import pytest
from unittest.mock import MagicMock
from datetime import datetime

from app.services.sessions_service import get_sessions


class TestGetSessions:
    def _setup_query(self, mock_db, rows, total):
        query = MagicMock()
        mock_db.query.return_value.join.return_value = query
        query.count.return_value = total
        query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = (
            rows
        )
        return query

    def test_returns_sessions_with_user(self, mock_db, sample_session, sample_user):
        self._setup_query(mock_db, [(sample_session, sample_user)], 1)

        result = get_sessions(mock_db, page=1, page_size=20)
        assert len(result["sessions"]) == 1
        assert result["sessions"][0] == sample_session
        assert sample_session.user == sample_user
        assert result["total"] == 1
        assert result["total_pages"] == 1

    def test_empty(self, mock_db):
        self._setup_query(mock_db, [], 0)

        result = get_sessions(mock_db, page=1, page_size=20)
        assert result["sessions"] == []
        assert result["total"] == 0
        assert result["total_pages"] == 1

    def test_pagination(self, mock_db, sample_session, sample_user):
        query = self._setup_query(mock_db, [(sample_session, sample_user)], 50)

        result = get_sessions(mock_db, page=3, page_size=10)
        assert result["total_pages"] == 5
        assert result["page"] == 3
        query.order_by.return_value.offset.assert_called_with(20)  # (3-1)*10
        query.order_by.return_value.offset.return_value.limit.assert_called_with(10)

    def test_multiple_sessions(self, mock_db, sample_user):
        s1 = MagicMock()
        s1.id = 1
        s1.open_at = datetime(2026, 3, 2, 10, 0)
        s1.close_at = datetime(2026, 3, 2, 10, 5)

        s2 = MagicMock()
        s2.id = 2
        s2.open_at = datetime(2026, 3, 1, 8, 0)
        s2.close_at = None

        self._setup_query(mock_db, [(s1, sample_user), (s2, sample_user)], 2)

        result = get_sessions(mock_db, page=1, page_size=20)
        assert len(result["sessions"]) == 2
        assert s1.user == sample_user
        assert s2.user == sample_user
