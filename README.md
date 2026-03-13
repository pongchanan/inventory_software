# Smart Inventory System

IoT-based inventory management with NFC/RFID tracking, MQTT kiosk communication, S3 image storage, and JWT authentication.

## Architecture

```
┌─────────────┐   MQTT (TCP)   ┌─────────────┐   HTTP/REST   ┌──────────────┐
│  ESP32      │ ◄────────────► │  Backend    │ ◄───────────► │  Frontend    │
│  Kiosk      │                │  FastAPI    │               │  Next.js     │
│  (Arduino)  │                │  Python     │               │  TypeScript  │
└─────────────┘                └─────────────┘               └──────────────┘
                                      │
                               ┌──────┴──────┐
                               │  PostgreSQL  │
                               │  (SQLite     │
                               │  locally)    │
                               └─────────────┘
```

## 📁 Structure

| Directory | Stack | Description |
|---|---|---|
| `/backend` | Python, FastAPI | REST API + MQTT handlers + S3 integration |
| `/frontend` | Next.js, TypeScript | Admin + user web dashboards |
| `/kiosk` | C++, Arduino (ESP32) | Kiosk firmware with NFC/RFID + MQTT |
| `/scripts` | Python | Dev utilities (kiosk config generator) |

## 🛠️ Local Development

### 1. Install all dependencies

```bash
npm run install-all
```

### 2. Configure environment

```bash
# Root .env — used by the kiosk config generator
cp backend/.env.example backend/.env
# Fill in your values
```

### 3. Start backend + frontend

```bash
npm run dev
# Backend → http://localhost:3000
# Frontend → http://localhost:3001
```

## 🔌 Kiosk (ESP32) Setup

The kiosk reads credentials from `kiosk/kiosk_main/kiosk_config.h`, which is **auto-generated** from your `.env` — never edit it manually.

1. Set WiFi + MQTT values in the root `.env`:
   ```dotenv
   WIFI_SSID=YourNetwork
   WIFI_PASSWORD=YourPassword
   NEXT_PUBLIC_API_URL=http://192.168.x.x:3000
   MOSQUITTO_TCP_HOST=your.broker
   MOSQUITTO_TCP_PORT=1883
   MOSQUITTO_USER=your_user
   JWT_SECRET=your_jwt_secret
   ```
2. Generate the config header:
   ```bash
   npm run kiosk:config
   ```
3. Open `kiosk/kiosk_main/kiosk_main.ino` in Arduino IDE and upload to the ESP32.

## ☁️ Deployment (Railway)

This is a monorepo with two independent Railway services:

1. Create **two services** in Railway from this repo.
2. Set **Root Directory** per service:
   - Backend service → `/backend`
   - Frontend service → `/frontend`
3. Railway detects `railway.json` in each folder automatically.
4. Set all environment variables from `backend/.env.example` in the Railway backend service settings.

## 📖 Documentation

- [Backend README](backend/README.md) — API endpoints, MQTT topics, database schema
- [Backend API Contract](docs/backend/API_CONTRACT.md) — canonical endpoint/payload/state-machine contract
- [Backend Setup Guide](docs/backend/SETUP_GUIDE.md) — Step-by-step setup and troubleshooting
- [Backend API Docs](docs/backend/API_DOCUMENTATION.md) — Full endpoint reference
- [Kiosk README](kiosk/kiosk_main/README.md) — Wiring, MQTT usage, library list


## 🛠️ Local Development

1. **Setup**: Install all dependencies (Node + Python venv)
   ```bash
   npm run install-all
   ```
2. **Run**: Start both Backend (3000) & Frontend (3001)
   ```bash
   npm run dev
   ```

## ☁️ Deployment (Railway)

This repo is structured as a **Monorepo**. To deploy:
1. Create **2 separate services** in Railway from this repo.
2. In Railway Service Settings:
   - For **Backend**: Set **Root Directory** to `/backend`.
   - For **Frontend**: Set **Root Directory** to `/frontend`.
3. Railway will automatically detect the `railway.json` in each folder.

## 🔌 Kiosk / ESP32 Configuration

Because the kiosk usually connects via a Mobile Hotspot, WiFi credentials and the API IP need to be updated frequently:
1. Update `WIFI_SSID`, `WIFI_PASSWORD`, and `NEXT_PUBLIC_API_URL` in your root `.env` file.
2. Run the config generator:
   ```bash
   npm run kiosk:config
   ```
   *This automatically generates `kiosk/kiosk_main/kiosk_config.h`.*
3. **Upload Code:** Connect the ESP32 via USB and upload the code using Arduino IDE or VSCode.

## 📁 Structure
- `/backend`: FastAPI (Python)
- `/frontend`: Next.js (TypeScript)
- `/kiosk`: ESP32 Firmware (Arduino)
- `/vision`: Vision subsystem (controller + inference)
- `/docs`: Architecture and technical documentation

## 📐 Architecture Documents
- `VISION_BASED_INVENTORY_ARCHITECTURE.md`: Vision-first drawer architecture, slot-based tracking model, lifecycle, and draft data model
- `PROJECT_STRUCTURE_BEFORE_AFTER.md`: Repository structure analysis, current vs target layout, and readability guidelines
