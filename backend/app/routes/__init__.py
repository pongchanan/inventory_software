from .users import router as users_router
from .items import router as items_router
from .transactions import router as transactions_router
from .loans import router as loans_router
from .approvals import router as approvals_router
from .audit_logs import router as audit_logs_router
from .compartments import router as compartments_router
from .drawers import router as drawers_router
from .stats import router as stats_router
from .auth import router as auth_router

__all__ = [
    "users_router",
    "items_router",
    "transactions_router",
    "loans_router",
    "approvals_router",
    "audit_logs_router",
    "compartments_router",
    "drawers_router",
    "stats_router",
    "auth_router",
]
