# Smart Inventory System

IoT-based inventory management with NFC/RFID tracking, MQTT kiosk communication, S3 image storage, AI-powered item enrollment via video, and JWT authentication.

## Architecture

```
┌─────────────┐   MQTT (TCP)   ┌─────────────┐   HTTP/REST   ┌──────────────┐
│  ESP32      │ ◄────────────► │  Backend    │ ◄───────────► │  Frontend    │
│  Kiosk      │                │  FastAPI    │               │  Next.js     │
│  (Arduino)  │                │  Python     │               │  TypeScript  │
└─────────────┘                └─────────────┘               └──────────────┘
                                      │                              │
                               ┌──────┴──────┐               ┌──────┴──────┐
                               │  PostgreSQL  │               │  S3-compat  │
                               │  (SQLite     │               │  object     │
                               │  locally)    │               │  storage    │
                               └─────────────┘               └─────────────┘
```

## 📁 Structure

| Directory | Stack | Description |
|---|---|---|
| `/backend` | Python, FastAPI | REST API + MQTT handlers + S3 integration + AI enrollment |
| `/frontend` | Next.js, TypeScript | Admin + user web dashboards |
| `/kiosk` | C++, Arduino (ESP32) | Kiosk firmware with NFC/RFID + MQTT |
| `/vision` | Python | Vision subsystem (controller + inference) |
| `/scripts` | Python | Dev utilities (kiosk config generator, migrations) |

## 🛠️ Local Development

For verified cross-platform steps (Windows/Linux/macOS), use:
- [docs/operations/run-guide.md](docs/operations/run-guide.md)

### 1. Install all dependencies

```bash
npm run install-all
```

### 2. Configure environment

Create root `.env` and copy values from `backend/.env.example`.
Fill in values required by your local setup — including S3 credentials for image storage.

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

## 🖼️ Image Storage (S3)

Item cover images are stored in S3-compatible object storage.

| Env var | Purpose |
|---|---|
| `AWS_ACCESS_KEY_ID` | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | S3 secret key |
| `AWS_ENDPOINT_URL` | Custom S3 endpoint (e.g. Cloudflare R2) |
| `AWS_DEFAULT_REGION` | Region (default: `auto`) |
| `S3_BUCKET_NAME` | Target bucket name |

**Image resolution priority (per item):**
1. Explicit image uploaded by admin via `PUT /api/items/{id}/image` or during enrollment
2. Best accepted frame extracted automatically from the enrollment video by the AI pipeline
3. `/placeholder.png` if neither is available

## 📦 Key Backend Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/items/` | — | List all active items (paginated) |
| `POST` | `/api/items/enroll` | Admin | Enroll new item (video + optional image) — async 202 |
| `GET` | `/api/items/enroll/jobs/{job_id}` | Admin | Poll enrollment job status |
| `PATCH` | `/api/items/{id}/quantity` | Admin | Adjust stock quantity by delta |
| `PUT` | `/api/items/{id}/image` | Admin | Upload / replace item cover image |

## 🎛️ Admin Inventory Page (`/admin/inventory`)

The asset management page lets admins:

- **Enroll** a new device with a short video clip (AI extracts training frames); an optional cover image can be attached at enrollment time
- **Edit Quantity** — click the pencil icon to adjust stock by a delta (positive to add, negative to remove)
- **Upload Image** — replace the cover photo for any existing item at any time
- **Delete** an item from the system

## 📖 Documentation

- [Backend README](backend/README.md) — API endpoints, MQTT topics, database schema
- [Backend API Contract](docs/backend/API_CONTRACT.md) — canonical endpoint/payload/state-machine contract
- [Backend Setup Guide](docs/backend/SETUP_GUIDE.md) — Step-by-step setup and troubleshooting
- [Backend API Docs](docs/backend/API_DOCUMENTATION.md) — Full endpoint reference
- [Kiosk README](kiosk/kiosk_main/README.md) — Wiring, MQTT usage, library list
- [Architecture](docs/architecture/README.md) — System context, data model, vision architecture

