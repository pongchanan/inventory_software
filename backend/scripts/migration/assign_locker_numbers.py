"""Assign physical locker numbers to the existing inventory items.

Run without arguments to verify the current catalogue.  Pass ``--apply`` only
after the verification reports all 91 expected items.
"""

from __future__ import annotations

import argparse
import sys
from collections import Counter
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import inspect, text

from app.database import SessionLocal, engine
from app.models.item import Item


# Item IDs and names are checked before assigning the locker number.  Several
# items intentionally share a locker because they are stored in the same bay.
ASSIGNMENTS: dict[int, tuple[str, str]] = {
    1: ("0.96-inch OLED Display Module", "066"),
    2: ("2.2-inch TFT SPI LCD Display Module", "054"),
    3: ("28BYJ-48 Stepper Motor", "104"),
    4: ("4-Channel Opto-Isolator Board", "076"),
    5: ("AI-Thinker Ra-01 LoRa Module", "110"),
    6: ("Arduino Uno R3", "063"),
    7: ("BESTEP 1-Channel Relay Module (JQC3F-03VDC-C, 3V)", "061"),
    8: ("Capacitive Soil Moisture Sensor v2.0", "103"),
    9: ("CH340G USB to TTL Serial Adapter Module", "111"),
    10: ("CP2102 USB to TTL Serial Adapter Module", "092"),
    11: ("Custom Audio and Power PCB", "096"),
    12: ("Custom Microcontroller Board with Dual RJ45 and Buzzer", "075"),
    13: ("Custom Raspberry Pi HAT with 4 RJ45 Ports", "078"),
    14: ("DHT11 Temperature and Humidity Sensor Module", "058"),
    15: ("Dragino LoRa/GPS HAT", "051"),
    16: ("DRV8825 Stepper Motor Driver Module", "102"),
    17: ("Dual Shaft BO Motor with Encoder Disk", "056"),
    18: ("ESP32 30-Pin Expansion Board", "064"),
    19: ("ESP32 30-Pin Terminal Adapter Board", "071"),
    20: ("ESP32 DevKit V1 (30-pin)", "049"),
    21: ("ESP32-CAM Development Board", "065"),
    22: ("ESP32-CAM-MB Programmer Board", "069"),
    23: ("ETT ET-MINI PWR DUAL 12V Power Supply Board", "087"),
    24: ("FT232RL USB to TTL Serial Adapter Module", "095"),
    25: ("Futaba S3003 Servo Motor", "100"),
    26: ("Generic 2-Channel 5V Relay Module (SRD-05VDC-SL-C)", "057"),
    27: ("Generic Push Button Module", "084"),
    28: ("Google AIY Voice HAT", "068"),
    29: ("GY-BM ME/PM 280 Sensor Module", "109"),
    30: ("Hi-Link HLK-PM01 AC-DC Power Module", "053"),
    31: ("HW-201 IR Obstacle Avoidance Sensor Module", "074"),
    32: ("HW-611 BMP280 Barometric Pressure Sensor Module", "101"),
    33: ("INEX JCON-SERVO4 Servo Connection Board", "120"),
    34: ("INEX RELAY4i 4-Channel Relay Board", "083"),
    35: ("INEX Unicon Board", "112"),
    36: ("INEX ZX-DCM2 Motor Driver", "097"),
    37: ("INEX ZX-LED Module (Blue)", "081"),
    38: ("INEX ZX-LED Module (Green)", "081"),
    39: ("INEX ZX-LED Module (Red)", "081"),
    40: ("INEX ZX-LED3CL RGB LED Module", "057"),
    41: ("INEX ZX-POTH Potentiometer Module", "099"),
    42: ("INEX ZX-SOUND Module", "107"),
    43: ("INEX ZX-SPEAKER Module", "094"),
    44: ("INEX ZX-Switch01 Module", "082"),
    45: ("Keyes 3_Clr RGB LED Module", "080"),
    46: ("Keyes 4-Channel 12V Relay Module", "079"),
    47: ("Keyes KY-018 Photoresistor Module", "117"),
    48: ("Keyes L9110 Fan Motor Module", "090"),
    49: ("Kingston 2GB DDR3 1333MHz RAM", "061"),
    50: ("L298N Motor Driver Module", "105"),
    51: ("LC Technology SD Card Module", "072"),
    52: ("LDR Light Sensor Module", "085"),
    53: ("LM393 Reed Switch Sensor Module", "070"),
    54: ("LPCXpresso LPC1769 Board", "091"),
    55: ("MAX485 TTL to RS485 Module", "116"),
    56: ("MH 3.3V/5V Power Supply Module", "049"),
    57: ("MH-FMD Buzzer Module", "050"),
    58: ("MH-Sensor-Series LM393 Comparator Module", "062"),
    59: ("Mini DC-DC Boost Converter (5V/8V/9V/12V)", "108"),
    60: ("Mini Solenoid Lock", "113"),
    61: ("Mini Submersible Water Pump", "050"),
    62: ("MPU-6050 Gyroscope and Accelerometer Module (GY-521)", "073"),
    63: ("MT3608 DC-DC Boost Converter Module (V201)", "059"),
    64: ("N20 Micro Metal Gear Motor", "060"),
    65: ("NodeMCU / Wi-Fi Microcontroller Board (verify model)", "053"),
    66: ("NodeMCU Amica ESP8266 (DOITING ESP-12E)", "053"),
    67: ("NodeMCU ESP8266 (DOITING ESP-12F)", "053"),
    68: ("NodeMCU ESP8266 (V2/V3)", "053"),
    69: ("NRF24L01+ PA LNA Wireless Module", "086"),
    70: ("PIR Motion Sensor Module", "055"),
    71: ("Pixy CMUcam5 Image Sensor", "089"),
    72: ("Raspberry Pi Debug Probe", "115"),
    73: ("Raspberry Pi Pico W", "077"),
    74: ("RFID-RC522 Module", "052"),
    75: ("SD XMDZ 8W DC-DC Boost Converter", "088"),
    76: ("Shock Sensor", "055"),
    77: ("Single Shaft BO Motor", "058"),
    78: ("Soil Moisture Sensor Probe", "051"),
    79: ("Solenoid Lock", "114"),
    80: ("STM32 Blue Pill Terminal Block Breakout Board", "067"),
    81: ("STM32F103C8T6 Blue Pill Board", "054"),
    82: ("TB6560 Stepper Motor Driver Board", "106"),
    83: ("Tower Pro MG995 Servo Motor", "100"),
    84: ("Tower Pro SG90 Micro Servo", "052"),
    85: ("TP4056 Type-C Battery Charging Module", "093"),
    86: ("ULN2003 Stepper Motor Driver Board", "060"),
    87: ("Ultrasonic Distance Sensor Module", "098"),
    88: ("W5100 Ethernet Shield", "059"),
    89: ("Watterott S65-Shield", "056"),
    90: ("WCMCU-230 CAN Bus Transceiver Module", "118"),
    91: ("XL4015 CC/CV Step-Down Module", "119"),
}


def validate_catalog() -> tuple[list[str], list[tuple[int, str]]]:
    db = SessionLocal()
    try:
        rows = db.query(Item.id, Item.name).order_by(Item.id).all()
    finally:
        db.close()

    current = {item_id: name for item_id, name in rows}
    errors = []
    for item_id, (expected_name, locker_number) in ASSIGNMENTS.items():
        actual_name = current.get(item_id)
        if actual_name != expected_name:
            errors.append(
                f"Item {item_id}: expected {expected_name!r}, found {actual_name!r}"
            )
        if not (locker_number.isdigit() and len(locker_number) == 3):
            errors.append(f"Item {item_id}: invalid locker number {locker_number!r}")

    unassigned = [(item_id, name) for item_id, name in rows if item_id not in ASSIGNMENTS]
    return errors, unassigned


def ensure_locker_column() -> None:
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("items")}
    with engine.begin() as connection:
        if "locker_number" not in columns:
            connection.execute(text("ALTER TABLE items ADD COLUMN locker_number VARCHAR(3)"))
        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_items_locker_number ON items (locker_number)")
        )


def apply_assignments() -> None:
    ensure_locker_column()
    db = SessionLocal()
    try:
        items = {item.id: item for item in db.query(Item).filter(Item.id.in_(ASSIGNMENTS)).all()}
        conflicts = [
            f"Item {item_id} already has locker {item.locker_number!r}"
            for item_id, item in items.items()
            if item.locker_number not in (None, ASSIGNMENTS[item_id][1])
        ]
        if conflicts:
            raise RuntimeError("\n".join(conflicts))
        for item_id, item in items.items():
            item.locker_number = ASSIGNMENTS[item_id][1]
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Assign locker numbers to inventory items")
    parser.add_argument("--apply", action="store_true", help="write the validated assignments")
    args = parser.parse_args()

    errors, unassigned = validate_catalog()
    locker_counts = Counter(locker for _, locker in ASSIGNMENTS.values())
    print(f"Validated mapping: {len(ASSIGNMENTS)} items across {len(locker_counts)} lockers")
    if unassigned:
        print(f"Unassigned database items: {unassigned}")
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    if not args.apply:
        print("Dry run passed. Re-run with --apply to write the assignments.")
        return 0

    apply_assignments()
    print("Locker assignments applied successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
