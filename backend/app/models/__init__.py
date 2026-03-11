from .user import User
from .item import Item
from .transaction import Transaction
from .loan import Loan
from .approval import Approval
from .audit_log import AuditLog
from .compartment import Compartment

# Vision-based tracking models
from .item_type import ItemType
from .item_type_image import ItemTypeImage
from .drawer import Drawer
from .drawer_slot import DrawerSlot
from .drawer_session import DrawerSession
from .drawer_snapshot import DrawerSnapshot
from .slot_occupancy import SlotOccupancy
from .detection_event import DetectionEvent
from .inventory_event import InventoryEvent
from .exception_case import ExceptionCase

__all__ = [
    # Legacy RFID-based models (kept for backward compatibility)
    "User", "Item", "Transaction", "Loan", "Approval", "AuditLog", "Compartment",
    # Vision-based tracking models
    "ItemType", "ItemTypeImage",
    "Drawer", "DrawerSlot", "DrawerSession", "DrawerSnapshot",
    "SlotOccupancy", "DetectionEvent", "InventoryEvent", "ExceptionCase",
]
