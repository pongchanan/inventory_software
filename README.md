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

This repo is structured as a **Monorepo**. To deploy:
1. Create **2 separate services** in Railway from this repo.
2. In Railway Service Settings:
   - For **Backend**: Set **Root Directory** to `/backend`.
   - For **Frontend**: Set **Root Directory** to `/frontend`.
3. Railway will automatically detect the `railway.json` in each folder.

## 📁 Structure
- `/backend`: FastAPI (Python)
- `/frontend`: Next.js (TypeScript)
- `/kiosk`: ESP32 Firmware (Arduino)
