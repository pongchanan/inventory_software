import pytest
from unittest.mock import MagicMock

from app.services.borrowings_service import (
    get_user_borrowings,
    get_all_borrowings_admin,
    get_popular_items,
)


class TestGetUserBorrowings:
    def _setup_query(self, mock_db, borrowings, total):
        query = MagicMock()
        mock_db.query.return_value.filter.return_value = query
        query.count.return_value = total
        query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = (
            borrowings
        )
        return query

    def test_returns_borrowings(self, mock_db, sample_borrowing):
        self._setup_query(mock_db, [sample_borrowing], 1)

        result = get_user_borrowings(mock_db, user_id=1, page=1, page_size=20)
        assert result["borrowings"] == [sample_borrowing]
        assert result["total"] == 1
        assert result["page"] == 1
        assert result["total_pages"] == 1

    def test_empty(self, mock_db):
        self._setup_query(mock_db, [], 0)

        result = get_user_borrowings(mock_db, user_id=1, page=1, page_size=20)
        assert result["borrowings"] == []
        assert result["total"] == 0
        assert result["total_pages"] == 1

    def test_pagination(self, mock_db, sample_borrowing):
        query = self._setup_query(mock_db, [sample_borrowing], 45)

        result = get_user_borrowings(mock_db, user_id=1, page=2, page_size=20)
        assert result["total_pages"] == 3
        assert result["page"] == 2
        query.order_by.return_value.offset.assert_called_with(20)  # (2-1)*20
        query.order_by.return_value.offset.return_value.limit.assert_called_with(20)


class TestGetAllBorrowingsAdmin:
    def _setup_query(self, mock_db, borrowings, total):
        query = MagicMock()
        mock_db.query.return_value.join.return_value = query
        query.count.return_value = total
        query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = (
            borrowings
        )
        return query

    def test_returns_all_borrowings(self, mock_db, sample_borrowing):
        self._setup_query(mock_db, [sample_borrowing], 1)

        result = get_all_borrowings_admin(mock_db, page=1, page_size=20)
        assert result["borrowings"] == [sample_borrowing]
        assert result["total"] == 1
        assert result["page"] == 1
        assert result["total_pages"] == 1

    def test_empty(self, mock_db):
        self._setup_query(mock_db, [], 0)

        result = get_all_borrowings_admin(mock_db, page=1, page_size=20)
        assert result["borrowings"] == []
        assert result["total"] == 0
        assert result["total_pages"] == 1

    def test_pagination(self, mock_db, sample_borrowing):
        query = self._setup_query(mock_db, [sample_borrowing], 45)

        result = get_all_borrowings_admin(mock_db, page=2, page_size=20)
        assert result["total_pages"] == 3
        assert result["page"] == 2
        query.order_by.return_value.offset.assert_called_with(20)  # (2-1)*20
        query.order_by.return_value.offset.return_value.limit.assert_called_with(20)


class TestGetPopularItems:
    def _setup_query(self, mock_db, rows, total):
        query = MagicMock()
        mock_db.query.return_value.join.return_value.group_by.return_value.order_by.return_value = (
            query
        )
        query.count.return_value = total
        query.offset.return_value.limit.return_value.all.return_value = rows
        return query

    def test_returns_popular_items(self, mock_db):
        row = MagicMock()
        row.id = 1
        row.name = "Hammer"
        row.image_path = "/img/hammer.jpg"
        row.borrow_count = 10
        self._setup_query(mock_db, [row], 1)

        result = get_popular_items(mock_db, page=1, page_size=20)
        assert len(result["items"]) == 1
        assert result["items"][0]["item_id"] == 1
        assert result["items"][0]["name"] == "Hammer"
        assert result["items"][0]["borrow_count"] == 10
        assert result["total"] == 1

    def test_empty(self, mock_db):
        self._setup_query(mock_db, [], 0)

        result = get_popular_items(mock_db, page=1, page_size=20)
        assert result["items"] == []
        assert result["total"] == 0
        assert result["total_pages"] == 1

    def test_pagination(self, mock_db):
        row = MagicMock()
        row.id = 1
        row.name = "Wrench"
        row.image_path = None
        row.borrow_count = 5
        query = self._setup_query(mock_db, [row], 30)

        result = get_popular_items(mock_db, page=2, page_size=10)
        assert result["total_pages"] == 3
        assert result["page"] == 2
        query.offset.assert_called_with(10)  # (2-1)*10
        query.offset.return_value.limit.assert_called_with(10)

    def test_multiple_items_sorted(self, mock_db):
        row1 = MagicMock()
        row1.id = 1
        row1.name = "Hammer"
        row1.image_path = None
        row1.borrow_count = 20

        row2 = MagicMock()
        row2.id = 2
        row2.name = "Drill"
        row2.image_path = None
        row2.borrow_count = 5

        self._setup_query(mock_db, [row1, row2], 2)

        result = get_popular_items(mock_db, page=1, page_size=20)
        assert result["items"][0]["borrow_count"] >= result["items"][1]["borrow_count"]
