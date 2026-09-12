"""Generate modern, high-resolution SVG artwork for electronic laboratory components."""

from pathlib import Path

PUBLIC_ITEMS_DIR = Path(__file__).resolve().parents[2] / "frontend" / "public" / "items"
PUBLIC_ITEMS_DIR.mkdir(parents=True, exist_ok=True)

ITEMS = [
    {
        "filename": "esp32.svg",
        "title": "ESP32-WROOM-32D",
        "subtitle": "Dual-Core Wi-Fi & BLE MCU",
        "bg_grad": ("#0f172a", "#1e293b"),
        "accent": "#38bdf8",
        "chip_color": "#1e293b",
        "badge": "2.4GHz Wi-Fi / BLE 4.2",
        "icon_type": "mcu"
    },
    {
        "filename": "dht11.svg",
        "title": "DHT11 Sensor",
        "subtitle": "Temperature & Humidity",
        "bg_grad": ("#064e3b", "#065f46"),
        "accent": "#34d399",
        "chip_color": "#047857",
        "badge": "20-90% RH | 0-50°C",
        "icon_type": "temp"
    },
    {
        "filename": "hc_sr04.svg",
        "title": "HC-SR04 Ultrasonic",
        "subtitle": "Distance & Ranging Sensor",
        "bg_grad": ("#1e1b4b", "#312e81"),
        "accent": "#818cf8",
        "chip_color": "#3730a3",
        "badge": "2cm - 400cm Non-Contact",
        "icon_type": "sonar"
    },
    {
        "filename": "sg90.svg",
        "title": "SG90 Micro Servo",
        "subtitle": "9g 180° Position Actuator",
        "bg_grad": ("#1e3a8a", "#1d4ed8"),
        "accent": "#60a5fa",
        "chip_color": "#2563eb",
        "badge": "1.8 kg/cm Torque | 5V PWM",
        "icon_type": "motor"
    },
    {
        "filename": "arduino_uno.svg",
        "title": "Arduino Uno R3",
        "subtitle": "ATmega328P Development Board",
        "bg_grad": ("#0f766e", "#115e59"),
        "accent": "#2dd4bf",
        "chip_color": "#134e4a",
        "badge": "5V Logic | 14 Digital / 6 Analog",
        "icon_type": "board"
    },
    {
        "filename": "l298n.svg",
        "title": "L298N Motor Driver",
        "subtitle": "Dual H-Bridge DC/Stepper",
        "bg_grad": ("#831843", "#9d174d"),
        "accent": "#f472b6",
        "chip_color": "#be185d",
        "badge": "2A Peak Dual Channel Driver",
        "icon_type": "driver"
    },
    {
        "filename": "mlx90640.svg",
        "title": "MLX90640 Thermal Camera",
        "subtitle": "32x24 IR Thermal Matrix",
        "bg_grad": ("#7c2d12", "#9a3412"),
        "accent": "#fb923c",
        "chip_color": "#c2410c",
        "badge": "768-Pixel Radiometric Array",
        "icon_type": "thermal"
    },
    {
        "filename": "amg8833.svg",
        "title": "AMG8833 Grid-EYE",
        "subtitle": "8x8 Infrared Array Sensor",
        "bg_grad": ("#701a75", "#86198f"),
        "accent": "#e879f9",
        "chip_color": "#a21caf",
        "badge": "64 Pixel Human Detection",
        "icon_type": "thermal"
    },
    {
        "filename": "dht22.svg",
        "title": "DHT22 / AM2302",
        "subtitle": "High Precision Climate Sensor",
        "bg_grad": ("#14532d", "#15803d"),
        "accent": "#4ade80",
        "chip_color": "#166534",
        "badge": "-40 to 80°C | ±2% Accuracy",
        "icon_type": "temp"
    },
    {
        "filename": "ds18b20.svg",
        "title": "DS18B20 Probe",
        "subtitle": "Waterproof 1-Wire Digital Probe",
        "bg_grad": ("#134e4a", "#042f2e"),
        "accent": "#5eead4",
        "chip_color": "#115e59",
        "badge": "Stainless Steel -55 to 125°C",
        "icon_type": "probe"
    },
    {
        "filename": "soil_moisture.svg",
        "title": "Capacitive Soil Sensor",
        "subtitle": "Corrosion Resistant Moisture",
        "bg_grad": ("#713f12", "#854d0e"),
        "accent": "#facc15",
        "chip_color": "#a16207",
        "badge": "Analog Voltage Output v1.2",
        "icon_type": "soil"
    },
    {
        "filename": "mq2.svg",
        "title": "MQ-2 Gas Sensor",
        "subtitle": "Smoke, LPG & Flammable Gas",
        "bg_grad": ("#78350f", "#92400e"),
        "accent": "#fbbf24",
        "chip_color": "#b45309",
        "badge": "Fast Response | DO/AO Outputs",
        "icon_type": "gas"
    },
    {
        "filename": "bme280.svg",
        "title": "BME280 Sensor",
        "subtitle": "Pressure, Humidity & Temp",
        "bg_grad": ("#1e3a8a", "#1e40af"),
        "accent": "#93c5fd",
        "chip_color": "#1d4ed8",
        "badge": "I2C/SPI Barometric 3-in-1",
        "icon_type": "weather"
    },
    {
        "filename": "pir_sensor.svg",
        "title": "HC-SR501 PIR Sensor",
        "subtitle": "Pyroelectric Motion Detector",
        "bg_grad": ("#312e81", "#3730a3"),
        "accent": "#a5b4fc",
        "chip_color": "#4338ca",
        "badge": "Adjustable Sensitivity & Delay",
        "icon_type": "motion"
    },
    {
        "filename": "oled_096.svg",
        "title": "0.96\" I2C OLED",
        "subtitle": "128x64 Graphic Display",
        "bg_grad": ("#0284c7", "#0369a1"),
        "accent": "#38bdf8",
        "chip_color": "#075985",
        "badge": "SSD1306 Blue OLED Display",
        "icon_type": "display"
    },
    {
        "filename": "lcd_1602.svg",
        "title": "16x2 I2C LCD Display",
        "subtitle": "Character LCD Module",
        "bg_grad": ("#15803d", "#166534"),
        "accent": "#86efac",
        "chip_color": "#14532d",
        "badge": "HD44780 Backlit Display",
        "icon_type": "display"
    },
    {
        "filename": "rc522_rfid.svg",
        "title": "RC522 RFID / NFC",
        "subtitle": "13.56MHz Contactless Reader",
        "bg_grad": ("#4c1d95", "#5b21b6"),
        "accent": "#c084fc",
        "chip_color": "#6d28d9",
        "badge": "SPI Interface + Keyfob/Card",
        "icon_type": "rfid"
    },
    {
        "filename": "esp32_cam.svg",
        "title": "ESP32-CAM Module",
        "subtitle": "OV2640 Camera + Wi-Fi/BLE",
        "bg_grad": ("#0f172a", "#1e293b"),
        "accent": "#f43f5e",
        "chip_color": "#334155",
        "badge": "2MP Camera + MicroSD Slot",
        "icon_type": "camera"
    },
    {
        "filename": "pico_w.svg",
        "title": "Raspberry Pi Pico W",
        "subtitle": "RP2040 Dual ARM Cortex-M0+",
        "bg_grad": ("#881337", "#9f1239"),
        "accent": "#fda4af",
        "chip_color": "#be123c",
        "badge": "264KB SRAM + 2.4GHz Wi-Fi",
        "icon_type": "mcu"
    },
    {
        "filename": "relay_1ch.svg",
        "title": "5V 1-Ch Relay Module",
        "subtitle": "Optocoupler Isolated Switch",
        "bg_grad": ("#0369a1", "#075985"),
        "accent": "#7dd3fc",
        "chip_color": "#0c4a6e",
        "badge": "10A 250VAC / 30VDC Control",
        "icon_type": "relay"
    },
    {
        "filename": "relay_4ch.svg",
        "title": "5V 4-Ch Relay Board",
        "subtitle": "Multi-Channel Home Relay",
        "bg_grad": ("#1e3a8a", "#172554"),
        "accent": "#93c5fd",
        "chip_color": "#1e40af",
        "badge": "4 Independent Opto Relays",
        "icon_type": "relay"
    },
    {
        "filename": "water_pump.svg",
        "title": "5V Water Pump (Mini)",
        "subtitle": "Submersible DC Water Pump",
        "bg_grad": ("#0e7490", "#155e75"),
        "accent": "#67e8f9",
        "chip_color": "#164e63",
        "badge": "120L/H Flow Rate + 1m Tube",
        "icon_type": "pump"
    },
    {
        "filename": "stepper_nema17.svg",
        "title": "NEMA 17 Stepper",
        "subtitle": "Bipolar 4-Wire 1.8° Motor",
        "bg_grad": ("#334155", "#1e293b"),
        "accent": "#94a3b8",
        "chip_color": "#475569",
        "badge": "42mm 1.5A 40N.cm Torque",
        "icon_type": "motor"
    },
    {
        "filename": "a4988.svg",
        "title": "A4988 Stepper Driver",
        "subtitle": "Microstepping Driver Module",
        "bg_grad": ("#831843", "#701a75"),
        "accent": "#f472b6",
        "chip_color": "#9d174d",
        "badge": "Up to 1/16 Microsteps + Heat Sink",
        "icon_type": "driver"
    },
    {
        "filename": "robot_chassis.svg",
        "title": "2WD Robot Car Chassis",
        "subtitle": "Dual TT DC Motors & Wheels",
        "bg_grad": ("#ca8a04", "#a16207"),
        "accent": "#fef08a",
        "chip_color": "#854d0e",
        "badge": "Smart Vehicle Base + Caster",
        "icon_type": "robot"
    },
    {
        "filename": "battery_shield.svg",
        "title": "18650 Battery Shield",
        "subtitle": "Dual Cell 5V/3A Power Pack",
        "bg_grad": ("#166534", "#14532d"),
        "accent": "#86efac",
        "chip_color": "#15803d",
        "badge": "Type-C Charging + 3V/5V Rails",
        "icon_type": "battery"
    }
]

def make_svg(item):
    g1, g2 = item["bg_grad"]
    accent = item["accent"]
    chip = item["chip_color"]
    title = item["title"]
    sub = item["subtitle"]
    badge = item["badge"]

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{g1}"/>
      <stop offset="100%" stop-color="{g2}"/>
    </linearGradient>
    <linearGradient id="chip_grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{chip}"/>
      <stop offset="100%" stop-color="{g1}"/>
    </linearGradient>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="600" height="380" rx="16" fill="url(#bg)"/>
  <rect width="600" height="380" rx="16" fill="url(#grid)"/>

  <!-- Circuit Trace Accents -->
  <path d="M 40 40 L 140 40 L 180 80 L 420 80 L 460 40 L 560 40" fill="none" stroke="{accent}" stroke-width="2" stroke-opacity="0.3"/>
  <circle cx="140" cy="40" r="4" fill="{accent}"/>
  <circle cx="460" cy="40" r="4" fill="{accent}"/>
  <circle cx="560" cy="40" r="4" fill="{accent}"/>

  <!-- Central PCB / Component Visual -->
  <g transform="translate(180, 70)">
    <rect x="0" y="0" width="240" height="150" rx="12" fill="url(#chip_grad)" stroke="{accent}" stroke-width="2.5" stroke-opacity="0.9"/>
    
    <!-- Gold Contact Pins (Top & Bottom) -->
    <g fill="#eab308">
      <rect x="25" y="-8" width="10" height="8" rx="2"/>
      <rect x="55" y="-8" width="10" height="8" rx="2"/>
      <rect x="85" y="-8" width="10" height="8" rx="2"/>
      <rect x="115" y="-8" width="10" height="8" rx="2"/>
      <rect x="145" y="-8" width="10" height="8" rx="2"/>
      <rect x="175" y="-8" width="10" height="8" rx="2"/>
      <rect x="205" y="-8" width="10" height="8" rx="2"/>

      <rect x="25" y="150" width="10" height="8" rx="2"/>
      <rect x="55" y="150" width="10" height="8" rx="2"/>
      <rect x="85" y="150" width="10" height="8" rx="2"/>
      <rect x="115" y="150" width="10" height="8" rx="2"/>
      <rect x="145" y="150" width="10" height="8" rx="2"/>
      <rect x="175" y="150" width="10" height="8" rx="2"/>
      <rect x="205" y="150" width="10" height="8" rx="2"/>
    </g>

    <!-- Main Microcontroller / Sensor Core Die -->
    <rect x="40" y="25" width="160" height="100" rx="8" fill="#0f172a" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <circle cx="55" cy="40" r="3" fill="#22c55e"/>
    
    <!-- Chip Text -->
    <text x="120" y="70" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" text-anchor="middle" letter-spacing="1">HARDWARE LAB</text>
    <text x="120" y="92" fill="{accent}" font-family="monospace" font-size="11" font-weight="600" text-anchor="middle">{item['filename'].replace('.svg','').upper()}</text>
  </g>

  <!-- Bottom Details & Typography -->
  <g transform="translate(40, 265)">
    <!-- Badge -->
    <rect x="0" y="0" width="220" height="26" rx="13" fill="rgba(0,0,0,0.4)" stroke="{accent}" stroke-width="1.2"/>
    <circle cx="12" cy="13" r="4" fill="#22c55e"/>
    <text x="24" y="17" fill="#f1f5f9" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="600">{badge}</text>

    <!-- Title & Subtitle -->
    <text x="0" y="56" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800">{title}</text>
    <text x="0" y="80" fill="rgba(255,255,255,0.7)" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13">{sub}</text>
  </g>
</svg>
"""

for item in ITEMS:
    svg_content = make_svg(item)
    file_path = PUBLIC_ITEMS_DIR / item["filename"]
    file_path.write_text(svg_content, encoding="utf-8")
    print(f"Generated: {item['filename']}")

print(f"\n🎉 Successfully created {len(ITEMS)} SVG component illustrations in frontend/public/items/!")
