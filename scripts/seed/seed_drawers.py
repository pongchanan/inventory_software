"""
Seed: drawers, slots, and item types
---------------------------------------
Populates the database with:
  - 3 drawers  (Cabinet A, B, C — each on floor 1)
  - Grid slots with calibrated polygon coordinates per drawer
  - 25 item types across 7 categories

Design notes
  - Polygon coordinates assume a 640 × 480 top-down camera image.
  - Coordinates are stored as a JSON array of [x, y] corner points
    in clockwise order: top-left, top-right, bottom-right, bottom-left.
  - A 4-pixel inset is applied per slot to model the acrylic grid dividers.
  - Consumables are flagged tracking_mode="bulk" and their slots
    is_tracked=False — the vision pipeline ignores those slots.

Usage (from backend/):
    python scripts/seed/seed_drawers.py

Re-running is safe — existing records are skipped by code_or_name deduplication.
"""

import sys
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv(ROOT_DIR / ".env")

# Import all models so create_all picks them up if tables are missing
import app.models  # noqa: F401
from app.database import SessionLocal, engine, Base
from app.models.item_type import ItemType
from app.models.drawer import Drawer
from app.models.drawer_slot import DrawerSlot

# ---------------------------------------------------------------------------
# Create tables if they don't exist yet (safe on fresh or existing DB)
# ---------------------------------------------------------------------------
Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_slot_polygon(
    row: int,
    col: int,
    img_w: int,
    img_h: int,
    rows: int,
    cols: int,
    inset: int = 4,
) -> str:
    """Return a JSON polygon string for one slot cell.

    Coordinates are pixel positions in the top-down camera image,
    with a small inset so the grid lines are not included in the crop.
    """
    cell_w = img_w / cols
    cell_h = img_h / rows
    x0 = col * cell_w + inset
    y0 = row * cell_h + inset
    x1 = x0 + cell_w - inset * 2
    y1 = y0 + cell_h - inset * 2
    return json.dumps([
        [round(x0), round(y0)],  # top-left
        [round(x1), round(y0)],  # top-right
        [round(x1), round(y1)],  # bottom-right
        [round(x0), round(y1)],  # bottom-left
    ])


# ---------------------------------------------------------------------------
# Drawer definitions
# ---------------------------------------------------------------------------
# Each dict mirrors DrawerCreate fields plus a "grid" key for slot generation.
# Camera image size is set to 640×480 — update after physical calibration.

DRAWERS = [
    {
        "drawer_code": "CAB-A-D1",
        "cabinet_code": "CAB-A",
        "floor": 1,
        "camera_id": "cam_cab_a_d1",
        "slot_rows": 4,
        "slot_cols": 6,
        "img_w": 640,
        "img_h": 480,
        "status": "active",
    },
    {
        "drawer_code": "CAB-B-D1",
        "cabinet_code": "CAB-B",
        "floor": 1,
        "camera_id": "cam_cab_b_d1",
        "slot_rows": 4,
        "slot_cols": 6,
        "img_w": 640,
        "img_h": 480,
        "status": "active",
    },
    {
        "drawer_code": "CAB-C-D1",
        "cabinet_code": "CAB-C",
        "floor": 1,
        "camera_id": "cam_cab_c_d1",
        "slot_rows": 3,
        "slot_cols": 4,
        "img_w": 640,
        "img_h": 480,
        "status": "active",
    },
]

# Row label letters and column numbers used to build slot codes
ROW_LABELS = "ABCDEFGH"


# ---------------------------------------------------------------------------
# Item type definitions
# ---------------------------------------------------------------------------
# Fields: code, name, category, description, tracking_mode
# tracking_mode:
#   loose  — track count by type, no serial tracking (most components)
#   bulk   — jumper wires / resistors — never count individual pieces
#   non_tracked — items temporarily excluded from vision tracking

ITEM_TYPES = [
    # ── Microcontrollers ─────────────────────────────────────────────────
    {
        "code": "ESP32_DEVKIT_V1",
        "name": "ESP32 DevKit V1",
        "category": "Microcontroller",
        "description": "Dual-core 240MHz, Wi-Fi + Bluetooth, 38-pin DevKit board",
        "tracking_mode": "loose",
    },
    {
        "code": "ESP8266_NODEMCU_V3",
        "name": "NodeMCU V3 (ESP8266)",
        "category": "Microcontroller",
        "description": "ESP8266 Wi-Fi SoC on Lolin V3 breakout, 30-pin",
        "tracking_mode": "loose",
    },
    {
        "code": "ARDUINO_NANO_328P",
        "name": "Arduino Nano (ATmega328P)",
        "category": "Microcontroller",
        "description": "ATmega328P, 5V, 16MHz, Mini-USB, 30-pin",
        "tracking_mode": "loose",
    },
    {
        "code": "ARDUINO_UNO_R3",
        "name": "Arduino Uno R3",
        "category": "Microcontroller",
        "description": "ATmega328P, 5V, 16MHz, USB-B, 28-pin",
        "tracking_mode": "loose",
    },
    {
        "code": "ARDUINO_MEGA_2560",
        "name": "Arduino Mega 2560",
        "category": "Microcontroller",
        "description": "ATmega2560, 5V, 16MHz, 54 digital I/O pins",
        "tracking_mode": "loose",
    },
    {
        "code": "RASPBERRY_PI_PICO",
        "name": "Raspberry Pi Pico",
        "category": "Microcontroller",
        "description": "RP2040, dual-core Cortex-M0+, 264KB SRAM, 2MB Flash",
        "tracking_mode": "loose",
    },
    {
        "code": "STM32_F103C8",
        "name": "STM32 Blue Pill (F103C8T6)",
        "category": "Microcontroller",
        "description": "ARM Cortex-M3, 72MHz, 20KB SRAM, 64KB Flash",
        "tracking_mode": "loose",
    },
    # ── Sensors ──────────────────────────────────────────────────────────
    {
        "code": "DHT22",
        "name": "DHT22 Temperature & Humidity",
        "category": "Sensor",
        "description": "±0.5°C accuracy, 0–100% RH, single-wire protocol",
        "tracking_mode": "loose",
    },
    {
        "code": "HCSR04",
        "name": "HC-SR04 Ultrasonic Distance",
        "category": "Sensor",
        "description": "2–400cm range, 4-pin, 5V, ~3ms cycle time",
        "tracking_mode": "loose",
    },
    {
        "code": "PIR_HC_SR501",
        "name": "PIR Motion Sensor HC-SR501",
        "category": "Sensor",
        "description": "Adjustable sensitivity and delay, 3.3–5V, wide lens",
        "tracking_mode": "loose",
    },
    {
        "code": "BMP280",
        "name": "BMP280 Pressure & Temperature",
        "category": "Sensor",
        "description": "I2C/SPI, ±1 hPa, ±1°C, 3.3V breakout",
        "tracking_mode": "loose",
    },
    {
        "code": "MPU6050",
        "name": "MPU-6050 Gyro & Accelerometer",
        "category": "Sensor",
        "description": "6-axis IMU, I2C, 3.3–5V breakout",
        "tracking_mode": "loose",
    },
    # ── Displays ─────────────────────────────────────────────────────────
    {
        "code": "OLED_096_I2C",
        "name": "0.96\" OLED Display (I2C)",
        "category": "Display",
        "description": "SSD1306, 128×64px, 3.3–5V, 4-pin I2C",
        "tracking_mode": "loose",
    },
    {
        "code": "LCD_1602_I2C",
        "name": "16×2 LCD Display (I2C)",
        "category": "Display",
        "description": "HD44780 + PCF8574 I2C backpack, 5V, adjustable contrast",
        "tracking_mode": "loose",
    },
    # ── Communication ─────────────────────────────────────────────────────
    {
        "code": "HC05_BLUETOOTH",
        "name": "HC-05 Bluetooth Module",
        "category": "Communication",
        "description": "Classic Bluetooth 2.0, UART, master/slave configurable",
        "tracking_mode": "loose",
    },
    {
        "code": "NRF24L01",
        "name": "NRF24L01 2.4GHz Radio",
        "category": "Communication",
        "description": "SPI, 250kbps–2Mbps, 3.3V, up to 100m range",
        "tracking_mode": "loose",
    },
    {
        "code": "SIM800L",
        "name": "SIM800L GSM/GPRS Module",
        "category": "Communication",
        "description": "Quad-band GSM, micro-SIM, UART, 3.4–4.4V",
        "tracking_mode": "loose",
    },
    # ── Actuators ─────────────────────────────────────────────────────────
    {
        "code": "SERVO_SG90",
        "name": "Servo Motor SG90",
        "category": "Actuator",
        "description": "9g micro servo, 0–180°, PWM 50Hz, 5V",
        "tracking_mode": "loose",
    },
    {
        "code": "L298N_DRIVER",
        "name": "L298N Dual H-Bridge Motor Driver",
        "category": "Actuator",
        "description": "2-channel, 2A peak, 5–35V motor supply",
        "tracking_mode": "loose",
    },
    {
        "code": "RELAY_5V_MODULE",
        "name": "5V Relay Module",
        "category": "Actuator",
        "description": "Single channel, optocoupler isolated, 10A/250VAC max",
        "tracking_mode": "loose",
    },
    # ── Power ─────────────────────────────────────────────────────────────
    {
        "code": "TP4056_MODULE",
        "name": "TP4056 Li-Ion Charger Module",
        "category": "Power",
        "description": "1A charge current, micro-USB input, over-discharge protection",
        "tracking_mode": "loose",
    },
    {
        "code": "LM7805_REG",
        "name": "LM7805 Voltage Regulator (TO-220)",
        "category": "Power",
        "description": "5V linear regulator, 1.5A max, TO-220 package",
        "tracking_mode": "loose",
    },
    # ── Consumables (bulk — not tracked per piece) ────────────────────────
    {
        "code": "JUMPER_WIRE_PACK",
        "name": "Jumper Wire Pack (120 pcs)",
        "category": "Consumable",
        "description": "M-M / M-F / F-F assorted 20cm jumper wires",
        "tracking_mode": "bulk",
    },
    {
        "code": "RESISTOR_KIT",
        "name": "Resistor Kit (600 pcs)",
        "category": "Consumable",
        "description": "1Ω–1MΩ, 30 values × 20 pcs, 1/4W 5%",
        "tracking_mode": "bulk",
    },
    {
        "code": "CAPACITOR_KIT",
        "name": "Ceramic Capacitor Kit (300 pcs)",
        "category": "Consumable",
        "description": "10pF–100nF, 10 values × 30 pcs, 50V",
        "tracking_mode": "bulk",
    },
    {
        "code": "LED_KIT_ASSORTED",
        "name": "LED Kit Assorted (100 pcs)",
        "category": "Consumable",
        "description": "5mm LED, Red/Green/Blue/Yellow/White, 20 pcs each",
        "tracking_mode": "bulk",
    },
    {
        "code": "BREADBOARD_MB102",
        "name": "Breadboard MB-102 (830 pts)",
        "category": "Breadboard",
        "description": "Full-size solderless breadboard, 2 power rails",
        "tracking_mode": "loose",
    },
]


# ---------------------------------------------------------------------------
# Seed functions
# ---------------------------------------------------------------------------

def seed_item_types(db) -> dict:
    """Insert item types, skip existing by code. Returns code→id map."""
    created, skipped = 0, 0
    type_map: dict[str, int] = {}
    for data in ITEM_TYPES:
        existing = db.query(ItemType).filter(ItemType.code == data["code"]).first()
        if existing:
            type_map[data["code"]] = existing.id
            skipped += 1
        else:
            obj = ItemType(**data)
            db.add(obj)
            db.flush()
            type_map[data["code"]] = obj.id
            created += 1
    db.commit()
    print(f"  Item types  — created: {created:>3}  skipped: {skipped:>3}")
    return type_map


def seed_drawers_and_slots(db):
    """Insert drawers and their grid slots, skip existing by drawer_code."""
    drawers_created, slots_created = 0, 0
    drawers_skipped, slots_skipped = 0, 0

    for d in DRAWERS:
        rows = d["slot_rows"]
        cols = d["slot_cols"]
        img_w = d["img_w"]
        img_h = d["img_h"]

        # --- Drawer ---
        existing_drawer = db.query(Drawer).filter(
            Drawer.drawer_code == d["drawer_code"]
        ).first()

        if existing_drawer:
            drawer_id = existing_drawer.id
            drawers_skipped += 1
        else:
            drawer = Drawer(
                drawer_code=d["drawer_code"],
                cabinet_code=d["cabinet_code"],
                floor=d["floor"],
                camera_id=d["camera_id"],
                slot_rows=rows,
                slot_cols=cols,
                status=d["status"],
            )
            db.add(drawer)
            db.flush()
            drawer_id = drawer.id
            drawers_created += 1

        # --- Slots ---
        for r in range(rows):
            for c in range(cols):
                slot_code = f"{d['drawer_code']}-{ROW_LABELS[r]}{c + 1}"
                existing_slot = db.query(DrawerSlot).filter(
                    DrawerSlot.slot_code == slot_code
                ).first()
                if existing_slot:
                    slots_skipped += 1
                    continue

                # Consumable slots: last column of every drawer is reserved for
                # bulk items and is therefore marked is_tracked=False.
                is_tracked = c < (cols - 1)

                slot = DrawerSlot(
                    drawer_id=drawer_id,
                    slot_code=slot_code,
                    row_index=r,
                    col_index=c,
                    polygon_json=make_slot_polygon(r, c, img_w, img_h, rows, cols),
                    is_tracked=is_tracked,
                )
                db.add(slot)
                slots_created += 1

    db.commit()
    print(
        f"  Drawers     — created: {drawers_created:>3}  skipped: {drawers_skipped:>3}"
    )
    print(
        f"  Slots       — created: {slots_created:>3}  skipped: {slots_skipped:>3}"
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def run():
    print("=" * 60)
    print("Seed: drawers, slots, and item types")
    print("=" * 60)

    db = SessionLocal()
    try:
        print("\nSeeding item types...")
        seed_item_types(db)

        print("\nSeeding drawers and slots...")
        seed_drawers_and_slots(db)

        print("\n✅ Seed complete.\n")
        print("Drawer summary:")
        for d in DRAWERS:
            total_slots = d["slot_rows"] * d["slot_cols"]
            tracked = d["slot_rows"] * (d["slot_cols"] - 1)
            bulk = d["slot_rows"]
            print(
                f"  {d['drawer_code']:15}  {d['slot_rows']}×{d['slot_cols']} "
                f"= {total_slots} slots  "
                f"(tracked={tracked}, bulk={bulk})"
            )
        print(f"\nItem types seeded: {len(ITEM_TYPES)}")

    except Exception as exc:
        db.rollback()
        print(f"\n❌ Seed failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
