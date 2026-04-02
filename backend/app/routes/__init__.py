from app.routes.auth import router as auth_router
from app.routes.borrowings import router as borrowings_router
from app.routes.card import router as card_router
from app.routes.items import router as items_router
from app.routes.users import router as users_router

__all__ = [
    "auth_router",
    "borrowings_router",
    "card_router",
    "items_router",
    "users_router",
]
