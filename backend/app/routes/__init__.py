from .auth import router as auth_router
from .users_api import router as users_router
from .item_types_api import router as item_types_router
from .storage_api import router as storage_router
from .access_sessions_api import router as access_sessions_router
from .observations_api import router as observations_router
from .inventory_api import router as inventory_router
from .audit_logs import router as audit_logs_router
from .kiosk_api import router as kiosk_router
from .statistics_api import router as statistics_router
from .notifications_api import router as notifications_router

__all__ = [
    "users_router",
    "item_types_router",
    "audit_logs_router",
    "storage_router",
    "access_sessions_router",
    "observations_router",
    "inventory_router",
    "auth_router",
    "kiosk_router",
    "statistics_router",
    "notifications_router",
]
