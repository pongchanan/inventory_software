# Smart Inventory System 🚀

IoT-based inventory management with NFC/RFID tracking.

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

This repo is pre-configured for **Railway Monorepo** deployment.
- Simply connect this GitHub repo to a Railway project.
- Railway will automatically detect `railway.json` and deploy the **backend** and **frontend** as separate services.

## 📁 Structure
- `/backend`: FastAPI (Python)
- `/frontend`: Next.js (TypeScript)
- `/kiosk`: ESP32 Firmware (Arduino)
