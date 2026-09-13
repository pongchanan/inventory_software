from app.schemas.chat import ChatMessage, ChatRequest
from app.services.chat_service import process_chat_query


def test_chat_service_temperature_query(mock_db):
    request = ChatRequest(
        message="I need a temperature and humidity sensor for greenhouse",
        history=[],
    )
    response = process_chat_query(mock_db, request)
    assert response is not None
    assert "Temperature" in response.reply or "DHT" in response.reply
    assert len(response.suggested_queries) > 0


def test_chat_service_distance_query(mock_db):
    request = ChatRequest(
        message="What sensor can detect distance or obstacles?",
        history=[],
    )
    response = process_chat_query(mock_db, request)
    assert response is not None
    assert "Ultrasonic" in response.reply or "distance" in response.reply.lower()


def test_chat_service_history_handling(mock_db):
    request = ChatRequest(
        message="How do I wire it?",
        history=[
            ChatMessage(role="user", content="I want to use DHT11"),
            ChatMessage(role="assistant", content="DHT11 is a temperature sensor"),
        ],
    )
    response = process_chat_query(mock_db, request)
    assert response is not None
    assert len(response.reply) > 10
