import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

from app.services.sessions_service import (
    get_sessions,
    close_session_with_image,
    get_session_image_url,
)


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


class TestCloseSessionWithImage:
    @patch(
        "app.services.sessions_service.upload_image",
        return_value="cabinet-images/session_1_abc.jpg",
    )
    def test_success(self, mock_upload, mock_db, sample_session):
        mock_db.query.return_value.filter.return_value.first.return_value = (
            sample_session
        )

        close_session_with_image(mock_db, 1, b"jpeg_bytes")

        mock_upload.assert_called_once_with(b"jpeg_bytes", 1)
        assert sample_session.close_image_path == "cabinet-images/session_1_abc.jpg"
        assert sample_session.close_at is not None
        mock_db.commit.assert_called_once()

    def test_session_not_found(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(ValueError, match="not found"):
            close_session_with_image(mock_db, 99, b"jpeg_bytes")
        mock_db.commit.assert_not_called()

    def test_already_closed(self, mock_db, sample_session):
        sample_session.close_at = datetime(2026, 3, 1, 10, 5)
        mock_db.query.return_value.filter.return_value.first.return_value = (
            sample_session
        )

        with pytest.raises(ValueError, match="already closed"):
            close_session_with_image(mock_db, 1, b"jpeg_bytes")
        mock_db.commit.assert_not_called()

    @patch(
        "app.services.sessions_service.upload_image", side_effect=Exception("S3 down")
    )
    def test_s3_failure_still_closes_session(
        self, mock_upload, mock_db, sample_session
    ):
        mock_db.query.return_value.filter.return_value.first.return_value = (
            sample_session
        )

        close_session_with_image(mock_db, 1, b"jpeg_bytes")

        assert sample_session.close_image_path is None
        assert sample_session.close_at is not None
        mock_db.commit.assert_called_once()


class TestGetSessionImageUrl:
    @patch(
        "app.services.sessions_service.get_presigned_url",
        return_value="https://s3.example.com/signed",
    )
    def test_success(self, mock_presigned, mock_db, sample_session):
        sample_session.close_image_path = "cabinet-images/session_1_abc.jpg"
        mock_db.query.return_value.filter.return_value.first.return_value = (
            sample_session
        )

        url = get_session_image_url(mock_db, 1)

        mock_presigned.assert_called_once_with("cabinet-images/session_1_abc.jpg")
        assert url == "https://s3.example.com/signed"

    def test_session_not_found(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(ValueError, match="not found"):
            get_session_image_url(mock_db, 99)

    def test_no_image(self, mock_db, sample_session):
        sample_session.close_image_path = None
        mock_db.query.return_value.filter.return_value.first.return_value = (
            sample_session
        )

        with pytest.raises(ValueError, match="no image"):
            get_session_image_url(mock_db, 1)
