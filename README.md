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
