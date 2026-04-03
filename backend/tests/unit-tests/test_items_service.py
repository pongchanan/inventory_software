import pytest
from unittest.mock import MagicMock, PropertyMock

from app.services.items_service import get_active_items


class TestGetActiveItems:
    def _setup_query(self, mock_db, items, total):
        query = MagicMock()
        mock_db.query.return_value.filter.return_value = query
        query.count.return_value = total
        query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = (
            items
        )
        return query

    def test_returns_items(self, mock_db, sample_item):
        self._setup_query(mock_db, [sample_item], 1)

        result = get_active_items(mock_db, page=1, page_size=20)
        assert result["items"] == [sample_item]
        assert result["total"] == 1
        assert result["page"] == 1
        assert result["page_size"] == 20
        assert result["total_pages"] == 1

    def test_empty(self, mock_db):
        self._setup_query(mock_db, [], 0)

        result = get_active_items(mock_db, page=1, page_size=20)
        assert result["items"] == []
        assert result["total"] == 0
        assert result["total_pages"] == 1

    def test_pagination_total_pages(self, mock_db, sample_item):
        self._setup_query(mock_db, [sample_item], 25)

        result = get_active_items(mock_db, page=1, page_size=10)
        assert result["total_pages"] == 3

    def test_page_params_forwarded(self, mock_db, sample_item):
        query = self._setup_query(mock_db, [sample_item], 50)

        result = get_active_items(mock_db, page=3, page_size=10)
        query.order_by.return_value.offset.assert_called_with(20)  # (3-1)*10
        query.order_by.return_value.offset.return_value.limit.assert_called_with(10)
        assert result["page"] == 3
