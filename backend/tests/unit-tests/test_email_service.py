import pytest
from unittest.mock import patch, MagicMock


class TestSendEmail:
    def test_skips_when_not_configured(self):
        """Returns False and does not open SMTP when credentials are missing."""
        with patch("app.services.email_service.SMTP_USER", ""), patch(
            "app.services.email_service.SMTP_PASSWORD", ""
        ):
            from app.services.email_service import send_email

            result = send_email("to@example.com", "Subject", "<p>body</p>")
        assert result is False

    def test_sends_and_returns_true(self):
        with patch("app.services.email_service.SMTP_USER", "sender@example.com"), patch(
            "app.services.email_service.SMTP_PASSWORD", "secret"
        ), patch("app.services.email_service.smtplib.SMTP") as mock_smtp_cls:

            mock_server = MagicMock()
            mock_smtp_cls.return_value.__enter__.return_value = mock_server

            from app.services.email_service import send_email

            result = send_email("to@example.com", "Hello", "<b>hi</b>")

        assert result is True
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("sender@example.com", "secret")
        mock_server.send_message.assert_called_once()

    def test_returns_false_on_smtp_error(self):
        with patch("app.services.email_service.SMTP_USER", "sender@example.com"), patch(
            "app.services.email_service.SMTP_PASSWORD", "secret"
        ), patch(
            "app.services.email_service.smtplib.SMTP",
            side_effect=Exception("connection refused"),
        ):

            from app.services.email_service import send_email

            result = send_email("to@example.com", "Hello", "<b>hi</b>")

        assert result is False
