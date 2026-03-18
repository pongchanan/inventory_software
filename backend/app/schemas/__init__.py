from .user import UserCreate, UserResponse
from .item import ItemCreate, ItemResponse
from .transaction import TransactionCreate, TransactionResponse
from .loan import LoanCreate, LoanResponse
from .approval import ApprovalCreate, ApprovalResponse, ApprovalUpdate
from .audit_log import AuditLogCreate, AuditLogResponse
from .compartment import CompartmentCreate, CompartmentResponse, CompartmentUpdate

# Vision-based tracking schemas
from .item_type import ItemTypeCreate, ItemTypeUpdate, ItemTypeResponse
from .item_type_image import ItemTypeImageCreate, ItemTypeImageResponse
from .drawer import DrawerCreate, DrawerUpdate, DrawerResponse
from .drawer_slot import DrawerSlotCreate, DrawerSlotUpdate, DrawerSlotResponse
from .drawer_session import DrawerSessionCreate, DrawerSessionUpdate, DrawerSessionResponse
from .drawer_snapshot import DrawerSnapshotCreate, DrawerSnapshotResponse
from .slot_occupancy import SlotOccupancyCreate, SlotOccupancyUpdate, SlotOccupancyResponse
from .detection_event import DetectionEventCreate, DetectionEventResponse
from .inventory_event import InventoryEventCreate, InventoryEventResponse
from .exception_case import ExceptionCaseCreate, ExceptionCaseResolve, ExceptionCaseResponse

__all__ = [
    # Legacy RFID-based schemas (kept for backward compatibility)
    "UserCreate", "UserResponse",
    "ItemCreate", "ItemResponse",
    "TransactionCreate", "TransactionResponse",
    "LoanCreate", "LoanResponse",
    "ApprovalCreate", "ApprovalResponse", "ApprovalUpdate",
    "AuditLogCreate", "AuditLogResponse",
    "CompartmentCreate", "CompartmentResponse", "CompartmentUpdate",
    # Vision-based tracking schemas
    "ItemTypeCreate", "ItemTypeUpdate", "ItemTypeResponse",
    "ItemTypeImageCreate", "ItemTypeImageResponse",
    "DrawerCreate", "DrawerUpdate", "DrawerResponse",
    "DrawerSlotCreate", "DrawerSlotUpdate", "DrawerSlotResponse",
    "DrawerSessionCreate", "DrawerSessionUpdate", "DrawerSessionResponse",
    "DrawerSnapshotCreate", "DrawerSnapshotResponse",
    "SlotOccupancyCreate", "SlotOccupancyUpdate", "SlotOccupancyResponse",
    "DetectionEventCreate", "DetectionEventResponse",
    "InventoryEventCreate", "InventoryEventResponse",
    "ExceptionCaseCreate", "ExceptionCaseResolve", "ExceptionCaseResponse",
]
