import pytest
from unittest.mock import MagicMock, patch

from app.services.items_service import get_active_items, update_item_quantity


class TestGetActiveItems:
    def _setup_query(self, mock_db, items, total):
        query = MagicMock()
        mock_db.query.return_value.filter.return_value = query
        query.count.return_value = total
        query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = (
            items
        )
        return query

    def test_returns_items_as_dicts(self, mock_db, sample_item):
        # get_active_items returns a list of dicts, not model objects
        self._setup_query(mock_db, [sample_item], 1)

        result = get_active_items(mock_db, page=1, page_size=20)
        assert len(result["items"]) == 1
        item = result["items"][0]
        assert item["id"] == sample_item.id
        assert item["name"] == sample_item.name
        assert item["quantity"] == sample_item.quantity
        assert item["is_active"] == sample_item.is_active
        assert result["total"] == 1
        assert result["page"] == 1
        assert result["page_size"] == 20
        assert result["total_pages"] == 1

    def test_image_is_presigned_url_when_sample_exists(self, mock_db, sample_item):
        self._setup_query(mock_db, [sample_item], 1)
        fake_key = "samples/item_1_abc.jpg"
        fake_url = "https://s3.example.com/presigned"

        with patch(
            "app.services.items_service._first_image_for_items",
            return_value={sample_item.id: fake_key},
        ), patch(
            "app.services.items_service.get_presigned_url",
            return_value=fake_url,
        ):
            result = get_active_items(mock_db, page=1, page_size=20)

        assert result["items"][0]["image"] == fake_url

    def test_image_is_none_when_no_sample(self, mock_db, sample_item):
        self._setup_query(mock_db, [sample_item], 1)

        with patch(
            "app.services.items_service._first_image_for_items",
            return_value={sample_item.id: None},
        ):
            result = get_active_items(mock_db, page=1, page_size=20)

        assert result["items"][0]["image"] is None

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


class TestUpdateItemQuantity:
    def test_add_stock(self, mock_db, sample_item):
        sample_item.quantity = 5
        mock_db.query.return_value.filter.return_value.first.return_value = sample_item

        update_item_quantity(mock_db, item_id=1, delta=3)

        assert sample_item.quantity == 8
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

    def test_remove_stock(self, mock_db, sample_item):
        sample_item.quantity = 5
        mock_db.query.return_value.filter.return_value.first.return_value = sample_item

        update_item_quantity(mock_db, item_id=1, delta=-2)

        assert sample_item.quantity == 3
        mock_db.commit.assert_called_once()

    def test_below_zero_raises(self, mock_db, sample_item):
        sample_item.quantity = 2
        mock_db.query.return_value.filter.return_value.first.return_value = sample_item

        with pytest.raises(ValueError, match="Cannot remove"):
            update_item_quantity(mock_db, item_id=1, delta=-5)
        mock_db.commit.assert_not_called()

    def test_item_not_found(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(ValueError, match="not found"):
            update_item_quantity(mock_db, item_id=999, delta=1)
        mock_db.commit.assert_not_called()
