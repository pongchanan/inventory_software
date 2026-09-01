from app.routes.activity_log import router as activity_log_router
from app.routes.auth import router as auth_router
from app.routes.borrowings import router as borrowings_router
from app.routes.card import router as card_router
from app.routes.chat import router as chat_router
from app.routes.damaged_reports import router as damaged_reports_router
from app.routes.dashboard import router as dashboard_router
from app.routes.items import router as items_router
from app.routes.sessions import router as sessions_router
from app.routes.users import router as users_router

__all__ = [
    "activity_log_router",
    "auth_router",
    "borrowings_router",
    "card_router",
    "chat_router",
    "damaged_reports_router",
    "dashboard_router",
    "items_router",
    "sessions_router",
    "users_router",
]
