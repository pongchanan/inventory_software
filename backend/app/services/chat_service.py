from __future__ import annotations

import json
import logging
import os
import re
import urllib.request
import urllib.error
from typing import Any

from sqlalchemy.orm import Session

from app.models.item import Item
from app.schemas.chat import ChatMessage, ChatRequest, ChatResponse, RecommendedItem
from app.services.s3_storage import get_presigned_url

logger = logging.getLogger(__name__)


def _get_inventory_context(db: Session) -> list[dict[str, Any]]:
    """Fetch all active items from DB with resolved image URLs and stock status."""
    items = db.query(Item).filter(Item.is_active == True).order_by(Item.name).all()  # noqa: E712
    context_list = []
    for item in items:
        image_url = None
        if item.image_path:
            try:
                image_url = get_presigned_url(item.image_path)
            except Exception:
                image_url = None

        context_list.append({
            "id": item.id,
            "name": item.name,
            "quantity": item.quantity,
            "in_stock": item.quantity > 0,
            "image_url": image_url,
        })
    return context_list


def _call_gemini_api(
    api_key: str,
    system_instruction: str,
    history: list[ChatMessage],
    user_message: str,
) -> str | None:
    """Call Google Gemini API via REST with system instructions and chat history."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    contents = []
    for msg in history[-6:]:  # Keep last 6 turns
        contents.append({
            "role": "user" if msg.role == "user" else "model",
            "parts": [{"text": msg.content}],
        })
    contents.append({
        "role": "user",
        "parts": [{"text": user_message}],
    })

    payload = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.5,
            "maxOutputTokens": 800,
        },
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
    except Exception as exc:
        logger.warning("[chat_service] Gemini API call failed: %s", exc)
    return None


def _local_rule_based_response(user_query: str, inventory: list[dict[str, Any]]) -> tuple[str, list[dict[str, Any]], list[str]]:
    """Local intelligent rule-based knowledge engine for hardware recommendations when API key is not set."""
    q = user_query.lower()
    recommended: list[dict[str, Any]] = []
    suggestions: list[str] = []

    # 1. Temperature / Humidity
    if any(k in q for k in ["temp", "humidity", "climate", "weather", "greenhouse", "dht"]):
        reply = (
            "### 🌡️ Temperature & Humidity Sensor Recommendation\n\n"
            "For measuring ambient temperature and humidity, the most common choices are:\n\n"
            "* **DHT11**: Ideal for beginner projects, greenhouse monitors, and room climate logging. "
            "Operates on 3.3V–5V with a single digital data pin (0–50°C, 20–90% RH).\n"
            "* **DHT22 (AM2302)**: Higher precision and wider range (-40 to 80°C).\n\n"
            "**Wiring Tip:** Connect VCC to 3.3V/5V, GND to Ground, and Data to any digital GPIO."
        )
        # Find matching items in DB
        for item in inventory:
            if any(k in item["name"].lower() for k in ["dht", "temp", "humidity"]):
                recommended.append(item)
        suggestions = ["How to wire DHT11 to ESP32?", "What is the accuracy of DHT11?", "Check available Arduino boards"]

    # 2. Distance / Obstacle / Proximity
    elif any(k in q for k in ["distance", "obstacle", "ultrasonic", "proximity", "range", "hc-sr04", "sonar"]):
        reply = (
            "### 🦇 Distance & Obstacle Detection Recommendation\n\n"
            "For non-contact distance measurement and obstacle avoidance:\n\n"
            "* **HC-SR04 Ultrasonic Sensor**: Measures distances from 2cm to 400cm using 40kHz ultrasound pulses. "
            "Uses `Trigger` and `Echo` pins to calculate time-of-flight.\n"
            "* **Usage:** Commonly used on autonomous robotic cars and smart trash bins."
        )
        for item in inventory:
            if any(k in item["name"].lower() for k in ["hc-sr04", "ultrasonic", "distance"]):
                recommended.append(item)
        suggestions = ["Parts for obstacle avoiding car", "Calculate distance from ultrasonic echo", "Check Servo motor stock"]

    # 3. Motors / Servos / Actuators / Drivers
    elif any(k in q for k in ["motor", "servo", "driver", "l298n", "sg90", "stepper", "speed"]):
        reply = (
            "### ⚙️ Motors & Actuators Recommendation\n\n"
            "Depending on your motion requirements:\n\n"
            "* **SG90 Micro Servo (9g)**: Best for precise angular positioning (0° to 180°), robotic arms, or steering mechanisms. Controlled via 50Hz PWM signals.\n"
            "* **L298N Dual H-Bridge Motor Driver**: Required when driving high-current DC motors or stepper motors that microcontrollers cannot power directly."
        )
        for item in inventory:
            if any(k in item["name"].lower() for k in ["servo", "motor", "driver", "l298n", "sg90"]):
                recommended.append(item)
        suggestions = ["Difference between Servo and Stepper", "How to wire L298N driver", "Check ESP32 stock"]

    # 4. Microcontrollers / Dev Boards / Wi-Fi
    elif any(k in q for k in ["esp32", "arduino", "microcontroller", "board", "wifi", "bluetooth", "ble"]):
        reply = (
            "### 📟 Microcontroller Recommendations\n\n"
            "* **ESP32-WROOM-32D**: High-performance dual-core 240MHz MCU with built-in Wi-Fi and Bluetooth BLE. "
            "Perfect for IoT sensors, cloud telemetry, MQTT, and web servers.\n"
            "* **Arduino Uno**: Sturdy 5V microcontroller ideal for simple logic, classroom prototyping, and analog sensors."
        )
        for item in inventory:
            if any(k in item["name"].lower() for k in ["esp32", "arduino", "uno"]):
                recommended.append(item)
        suggestions = ["Connect ESP32 to MQTT broker", "Read analog sensor on ESP32", "Check temperature sensor stock"]

    # 5. Project Bill of Materials (Obstacle car, Plant waterer, etc.)
    elif any(k in q for k in ["robot", "car", "plant", "water", "irrigation", "project", "bom"]):
        if any(k in q for k in ["plant", "water", "irrigation"]):
            reply = (
                "### 🌱 Smart Plant Watering System — Bill of Materials (BOM)\n\n"
                "Here is the recommended hardware stack for automated soil hydration:\n\n"
                "1. **Microcontroller:** ESP32 (for Wi-Fi alerts) or Arduino Uno\n"
                "2. **Soil Sensor:** Capacitive Soil Moisture Sensor v1.2\n"
                "3. **Actuator:** 5V Submersible Water Pump + Silicone Tubing\n"
                "4. **Switching:** 5V Relay Module or MOSFET driver\n"
                "5. **Power:** 5V 2A DC Adapter"
            )
        else:
            reply = (
                "### 🤖 Obstacle Avoiding Robot — Bill of Materials (BOM)\n\n"
                "Here are the core components needed to build an autonomous obstacle-avoiding vehicle:\n\n"
                "1. **Controller:** Arduino Uno or ESP32\n"
                "2. **Vision/Ranging:** HC-SR04 Ultrasonic Distance Sensor\n"
                "3. **Sensor Mount:** SG90 Micro Servo (sweeps left/right to find paths)\n"
                "4. **Motor Driver:** L298N Dual H-Bridge Driver\n"
                "5. **Chassis:** 2WD / 4WD Smart Car Chassis with DC Gear Motors"
            )
        for item in inventory:
            if any(k in item["name"].lower() for k in ["esp32", "arduino", "hc-sr04", "servo", "motor", "driver", "dht"]):
                recommended.append(item)
        suggestions = ["Check all available components", "How to wire L298N to Arduino", "Borrow items from cabinet"]

    # 6. Direct stock inquiry
    elif any(k in q for k in ["stock", "available", "how many", "count", "where"]):
        reply = "### 📦 Current Smart Cabinet Inventory\n\nHere are the active components currently registered in the system:"
        recommended = inventory[:6]
        suggestions = ["Suggest a sensor for distance", "Recommend parts for IoT weather station", "Check ESP32 stock"]

    # Default general guidance
    else:
        reply = (
            f"Hello! I am your **Smart Lab Inventory Assistant**.\n\n"
            f"I have live access to all **{len(inventory)} components** stored in our smart cabinet stations. "
            f"You can ask me:\n\n"
            f"* *'What sensor should I use to measure soil moisture?'*\n"
            f"* *'What parts do I need for an IoT weather station?'*\n"
            f"* *'Do we have any ESP32 microcontrollers in stock?'*\n"
            f"* *'How do I connect the HC-SR04 ultrasonic sensor?'*"
        )
        recommended = inventory[:4]
        suggestions = ["🌡️ Temperature sensor for Arduino", "🦇 Distance sensor for obstacle robot", "📟 Check ESP32 stock"]

    return reply, recommended, suggestions


def process_chat_query(db: Session, request: ChatRequest) -> ChatResponse:
    """Process user message, ground with inventory database, and return AI response."""
    inventory = _get_inventory_context(db)
    api_key = os.getenv("GEMINI_API_KEY")

    if api_key:
        # Build grounding prompt with real-time inventory list
        inv_summary = "\n".join(
            f"- ID {item['id']}: {item['name']} (Quantity in stock: {item['quantity']}, Status: {'In Stock' if item['in_stock'] else 'Out of Stock'})"
            for item in inventory
        )

        system_prompt = (
            "You are the intelligent AI Laboratory & Inventory Assistant for students at an engineering maker laboratory.\n"
            "Your job is to help students choose the right electronic hardware components (sensors, microcontrollers, actuators, modules) "
            "for their projects, explain how components work with wiring/pinout tips, and let them know whether items are available in the cabinet.\n\n"
            f"CURRENT LIVE CABINET INVENTORY:\n{inv_summary}\n\n"
            "GUIDELINES:\n"
            "1. Be helpful, clear, and educational. Provide code snippets or pin connection advice when appropriate.\n"
            "2. When recommending parts, specify the exact item names from the inventory list when they exist.\n"
            "3. If an item is in stock, encourage them to borrow it by tapping their NFC student card at the cabinet.\n"
            "4. Format your response cleanly using GitHub markdown."
        )

        ai_reply = _call_gemini_api(api_key, system_prompt, request.history, request.message)
        if ai_reply:
            # Find mentioned items in the AI reply to render cards
            matched_items: list[dict[str, Any]] = []
            for item in inventory:
                # Check if item name or major keyword is mentioned
                keywords = [k for k in re.split(r"[\s\-_/]+", item["name"].lower()) if len(k) >= 3]
                if item["name"].lower() in ai_reply.lower() or any(k in ai_reply.lower() for k in keywords):
                    if item not in matched_items:
                        matched_items.append(item)

            recommended_pydantic = [
                RecommendedItem(
                    id=it["id"],
                    name=it["name"],
                    quantity=it["quantity"],
                    image_url=it["image_url"],
                    in_stock=it["in_stock"],
                    reason="Mentioned in recommendations",
                )
                for it in matched_items[:6]
            ]

            return ChatResponse(
                reply=ai_reply,
                recommended_items=recommended_pydantic,
                suggested_queries=[
                    "Wiring details and pinout",
                    "What other parts do I need?",
                    "Check total stock in cabinet",
                ],
            )

    # Fallback to local heuristic engine if API key is not set or request failed
    reply, rec_items, suggestions = _local_rule_based_response(request.message, inventory)
    recommended_pydantic = [
        RecommendedItem(
            id=it["id"],
            name=it["name"],
            quantity=it["quantity"],
            image_url=it["image_url"],
            in_stock=it["in_stock"],
            reason="Matched hardware component",
        )
        for it in rec_items
    ]

    return ChatResponse(
        reply=reply,
        recommended_items=recommended_pydantic,
        suggested_queries=suggestions,
    )

