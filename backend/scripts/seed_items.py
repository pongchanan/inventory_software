"""Seed script to populate SQLite/PostgreSQL database with clean laboratory hardware items without requiring image files."""

from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env", override=True)

from app.database import init_db, SessionLocal
from app.models.item import Item

SEED_ITEMS = [
    {"name": "ESP32-WROOM-32D", "quantity": 6, "is_active": True},
    {"name": "DHT11 Temperature & Humidity Sensor", "quantity": 12, "is_active": True},
    {"name": "HC-SR04 Ultrasonic Distance Sensor", "quantity": 8, "is_active": True},
    {"name": "SG90 Micro Servo 9g", "quantity": 15, "is_active": True},
    {"name": "Arduino Uno R3 Compatible", "quantity": 8, "is_active": True},
    {"name": "L298N Dual H-Bridge Motor Driver", "quantity": 5, "is_active": True},
    {"name": "MLX90640 Non-Contact Thermal Camera (32x24 Array)", "quantity": 4, "is_active": True},
    {"name": "AMG8833 Grid-EYE Infrared Thermal Array Sensor", "quantity": 2, "is_active": True},
    {"name": "DHT22 Precision Temperature & Humidity Sensor (AM2302)", "quantity": 10, "is_active": True},
    {"name": "DS18B20 Waterproof Temperature Probe Sensor", "quantity": 14, "is_active": True},
    {"name": "Capacitive Soil Moisture Sensor v1.2", "quantity": 18, "is_active": True},
    {"name": "MQ-2 Smoke & Flammable Gas Sensor Module", "quantity": 7, "is_active": True},
    {"name": "BME280 Pressure, Humidity & Temperature Sensor (I2C/SPI)", "quantity": 6, "is_active": True},
    {"name": "PIR Motion Sensor HC-SR501", "quantity": 12, "is_active": True},
    {"name": "0.96 inch I2C OLED Display 128x64 (SSD1306 Blue)", "quantity": 9, "is_active": True},
    {"name": "16x2 I2C LCD Display Module (HD44780)", "quantity": 6, "is_active": True},
    {"name": "RC522 RFID Reader / Writer Module 13.56MHz SPI", "quantity": 8, "is_active": True},
    {"name": "ESP32-CAM AI-Thinker Camera Module (OV2640)", "quantity": 5, "is_active": True},
    {"name": "Raspberry Pi Pico W (RP2040 Dual-Core Wi-Fi)", "quantity": 10, "is_active": True},
    {"name": "5V 1-Channel Relay Module (Optocoupler Isolated 10A)", "quantity": 16, "is_active": True},
    {"name": "5V 4-Channel Relay Module Board", "quantity": 4, "is_active": True},
    {"name": "5V Mini Submersible Water Pump with 1m Tube", "quantity": 8, "is_active": True},
    {"name": "NEMA 17 Bipolar Stepper Motor (42x42mm 1.5A)", "quantity": 4, "is_active": True},
    {"name": "A4988 Stepper Motor Driver Module with Heat Sink", "quantity": 8, "is_active": True},
    {"name": "2WD Smart Robot Car Chassis Kit with DC Motors", "quantity": 3, "is_active": True},
    {"name": "18650 Dual Battery Shield with 5V/3A Output (Type-C)", "quantity": 7, "is_active": True},
]


def reset_and_seed_database():
    init_db()
    db = SessionLocal()
    try:
        # Delete existing items for a clean slate
        db.query(Item).delete()
        db.commit()

        # Re-add items without requiring image_path (image_path = None)
        for data in SEED_ITEMS:
            item = Item(
                name=data["name"],
                quantity=data["quantity"],
                is_active=data["is_active"],
                image_path=None,
                enroll_status="done",
            )
            db.add(item)

        db.commit()
        total = db.query(Item).count()
        print(f"✨ Successfully reset and seeded {total} clean items into the database (no images required).")
    finally:
        db.close()


if __name__ == "__main__":
    reset_and_seed_database()
