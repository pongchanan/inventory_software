# Smart Inventory Management System

A complete IoT-based inventory management system with NFC/RFID tracking, real-time monitoring, and automated access control.

## 🎯 System Overview

This system consists of four main components:

1. **ESP32 Kiosk** - Hardware controller with NFC/RFID readers
2. **FastAPI Backend** - RESTful API server with SQLite database
3. **Admin Dashboard** - React-based management interface
4. **User Dashboard** - React-based user interface

### Architecture

```
┌─────────────────┐
│  ESP32 Kiosk    │ ──┐
│  (NFC + RFID)   │   │
└─────────────────┘   │
                      ├──► ┌─────────────────┐      ┌──────────────────┐
┌─────────────────┐   │    │  FastAPI        │ ◄──► │  SQLite          │
│  Admin          │ ──┼──► │  Backend        │      │  Database        │
│  Dashboard      │   │    │  (Port 3000)    │      └──────────────────┘
└─────────────────┘   │    └─────────────────┘
                      │
┌─────────────────┐   │
│  User           │ ──┘
│  Dashboard      │
└─────────────────┘
```

## ✨ Features

- 🔐 **User Authentication** - NFC card-based access control
- 📦 **Item Tracking** - RFID tag scanning for inventory
- 🔒 **Smart Lock Control** - Automated cabinet locking
- 📊 **Real-time Monitoring** - Live dashboard updates
- ✅ **Approval Workflow** - Admin approval for high-value items
- 📝 **Audit Logging** - Complete activity tracking
- 🗄️ **Compartment Management** - Locker status monitoring
- 📈 **Analytics** - Usage statistics and reports
- 🏥 **System Health** - Real-time status monitoring

## 📋 Prerequisites

### For Backend & Dashboards
- **Python 3.8+** (for FastAPI backend)
- **Node.js 16+** and **npm** (for React dashboards)
- **Git** (for version control)

### For Kiosk Hardware
- **Arduino IDE** or **PlatformIO**
- **ESP32** development board
- **PN532** NFC reader module
- **MFRC522** RFID reader module
- **Solenoid lock**
- **Touch sensor** or switch

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd inventory_software
```

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Start the server
python main.py
```

The backend will start at **http://localhost:3000**

**Optional:** Add sample data
```bash
python seed_data.py
```

### 3. Admin Dashboard Setup

```bash
# Navigate to admin dashboard (in a new terminal)
cd admin/Smart\ Inventory\ Dashboard\ Design\(1\)

# Install dependencies
npm install

# Start development server
npm run dev
```

The admin dashboard will start at **http://localhost:5173**

### 4. User Dashboard Setup

```bash
# Navigate to user dashboard (in a new terminal)
cd user/Smart\ Inventory\ Dashboard\ Design

# Install dependencies
npm install

# Start development server
npm run dev
```

The user dashboard will start at **http://localhost:5174** (or next available port)

### 5. Kiosk Setup (ESP32)

1. Open `kiosk/kiosk_main/kiosk_main.ino` in Arduino IDE
2. Update configuration:
   ```cpp
   const char *ssid = "YOUR_WIFI_SSID";
   const char *password = "YOUR_WIFI_PASSWORD";
   const char *serverUrl = "http://YOUR_COMPUTER_IP:3000";
   ```
3. Install required libraries:
   - Adafruit PN532
   - MFRC522
   - WiFi
   - HTTPClient
4. Upload to ESP32 board

## 📖 Detailed Setup Instructions

### Backend (FastAPI)

#### Installation

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Configuration

Edit `.env` file (or create from `.env.example`):

```env
DATABASE_URL=sqlite:///./inventory.db
HOST=0.0.0.0
PORT=3000
DEBUG=True
```

#### Running

```bash
# Development mode with auto-reload
python main.py

# Or with uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 3000 --reload
```

#### API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc

#### Seeding Sample Data

```bash
python seed_data.py
```

This creates:
- 3 sample users (2 authorized, 1 blacklisted)
- 3 sample items (various categories)

### Admin Dashboard (React + Vite)

```bash
cd admin/Smart\ Inventory\ Dashboard\ Design\(1\)

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Features:**
- User management and access control
- Approval queue processing
- Real-time audit logs
- Inventory monitoring
- System health dashboard
- Analytics and statistics

### User Dashboard (React + Vite)

```bash
cd user/Smart\ Inventory\ Dashboard\ Design

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

**Features:**
- View active loans
- Browse available items
- Submit approval requests
- Track borrowing history
- View countdown timers

### Kiosk (ESP32)

#### Hardware Connections

**PN532 (NFC - User Cards):**
- SDA → GPIO 21
- SCL → GPIO 22
- VCC → 3.3V
- GND → GND

**MFRC522 (RFID - Items):**
- SDA/SS → GPIO 5
- SCK → GPIO 18
- MOSI → GPIO 23
- MISO → GPIO 19
- RST → GPIO 27
- VCC → 3.3V
- GND → GND

**Solenoid Lock:**
- Control → GPIO 26
- Power → External 12V supply
- Ground → Common GND

**Door Sensor:**
- Signal → GPIO 4 (with internal pull-up)
- GND → GND when closed

#### Software Setup

1. **Install Arduino Libraries:**
   - Adafruit PN532 by Adafruit
   - MFRC522 by GithubCommunity
   - ESP32 Board Support

2. **Configure WiFi and Server:**

   Edit `kiosk_main.ino`:
   ```cpp
   const char *ssid = "YourWiFiName";
   const char *password = "YourWiFiPassword";
   const char *serverUrl = "http://192.168.1.100:3000";  // Your computer's IP
   ```

3. **Upload to ESP32:**
   - Select Board: "ESP32 Dev Module"
   - Select Port: (Your ESP32's COM port)
   - Click Upload

4. **Monitor Serial Output:**
   - Open Serial Monitor (115200 baud)
   - Watch for WiFi connection and system status

## 🔄 System Workflow

### Normal Operation

1. **User Scans NFC Card** → System verifies via API
2. **Cabinet Unlocks** → User opens door
3. **User Scans Items** → System records each item
4. **User Closes Door** → System locks and sends transactions
5. **Backend Processes** → Creates loans, logs activity
6. **Dashboards Update** → Real-time status displayed

### High-Value Item Workflow

1. User requests high-value item via dashboard
2. Request enters approval queue
3. Admin reviews and approves/rejects
4. If approved, user can borrow via kiosk
5. System tracks with extended due dates

## 📡 API Endpoints

### Core Endpoints

- **Users**: `/api/users/`
- **Items**: `/api/items/`
- **Transactions**: `/api/transactions/`
- **Loans**: `/api/loans/`
- **Approvals**: `/api/approvals/`
- **Audit Logs**: `/api/audit-logs/`
- **Compartments**: `/api/compartments/`
- **Statistics**: `/api/stats/`

See [backend/README.md](backend/README.md) for complete API documentation.

## 🧪 Testing the System

### 1. Test Backend

```bash
# Check server status
curl http://localhost:3000/

# Get all users
curl http://localhost:3000/api/users/

# Get dashboard stats
curl http://localhost:3000/api/stats/dashboard
```

### 2. Test Dashboards

1. Open admin dashboard: http://localhost:5173
2. Open user dashboard: http://localhost:5174
3. Test navigation and components

### 3. Test Kiosk

1. Open Serial Monitor (115200 baud)
2. Check WiFi connection status
3. Scan test NFC card
4. Verify API communication

## 🐛 Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError`
```bash
# Solution: Install missing dependencies
pip install -r requirements.txt
```

**Problem:** Port 3000 already in use
```bash
# Solution: Change port in main.py or kill existing process
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### Dashboard Issues

**Problem:** `npm install` fails
```bash
# Solution: Clear cache and retry
npm cache clean --force
npm install
```

**Problem:** CORS errors
- Check backend CORS configuration in `main.py`
- Ensure `"*"` is in allowed origins for testing

### Kiosk Issues

**Problem:** WiFi won't connect
- Verify SSID and password
- Check WiFi signal strength
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)

**Problem:** PN532 not found
- Check I2C connections (SDA/SCL)
- Try different I2C pins
- Verify 3.3V power supply

**Problem:** MFRC522 not detecting cards
- Check SPI connections
- Verify RST pin connection
- Ensure proper power supply

**Problem:** API calls fail
- Verify server IP address is correct
- Check firewall settings
- Ensure backend is running
- Test with curl from ESP32's network

## 🗂️ Project Structure

```
inventory_software/
├── backend/                 # FastAPI server
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── schemas/        # Pydantic schemas
│   │   └── database.py     # Database setup
│   ├── main.py             # Server entry point
│   ├── requirements.txt    # Python dependencies
│   └── seed_data.py        # Sample data generator
│
├── admin/                   # Admin dashboard
│   └── Smart Inventory Dashboard Design(1)/
│       ├── src/
│       │   ├── components/ # React components
│       │   └── main.tsx    # Entry point
│       ├── package.json    # Node dependencies
│       └── vite.config.ts  # Vite configuration
│
├── user/                    # User dashboard
│   └── Smart Inventory Dashboard Design/
│       ├── src/
│       │   ├── components/ # React components
│       │   └── main.tsx    # Entry point
│       └── package.json    # Node dependencies
│
├── kiosk/                   # ESP32 firmware
│   └── kiosk_main/
│       ├── kiosk_main.ino  # Main Arduino sketch
│       └── README.md       # Kiosk documentation
│
└── README.md               # This file
```

## 🔐 Security Considerations

### For Demo/Development
- ✅ HTTP is acceptable
- ✅ CORS set to allow all origins
- ✅ No authentication required
- ✅ SQLite database

### For Production
- ⚠️ Use HTTPS/SSL
- ⚠️ Restrict CORS to specific origins
- ⚠️ Add JWT authentication
- ⚠️ Switch to PostgreSQL/MySQL
- ⚠️ Add rate limiting
- ⚠️ Use environment variables for secrets
- ⚠️ Enable request validation
- ⚠️ Add logging and monitoring

## 📊 Database Schema

- **users** - User accounts (NFC UID, name, email, authorization)
- **items** - Inventory items (RFID UID, name, category, availability)
- **transactions** - Raw kiosk transactions (user, item, action, timestamp)
- **loans** - Active/returned loans (user, item, dates, status)
- **approvals** - Approval requests (user, item, status, admin notes)
- **audit_logs** - System activity (type, user, item, status, message)
- **compartments** - Locker status (floor, number, status, occupancy)

## 🎨 Customization

### Add New Users
```bash
curl -X POST http://localhost:3000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "YOUR_NFC_UID",
    "name": "John Doe",
    "email": "john@example.com",
    "authorized": true
  }'
```

### Add New Items
```bash
curl -X POST http://localhost:3000/api/items/ \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "YOUR_RFID_UID",
    "name": "Laptop",
    "category": "Electronics",
    "available": true
  }'
```

## 📝 Development Tips

### Backend Development
```bash
# Auto-reload on changes
uvicorn main:app --reload

# View logs
# Logs appear in console

# Access database directly
sqlite3 inventory.db
```

### Frontend Development
```bash
# Hot reload enabled by default
npm run dev

# Check for errors
npm run build

# Format code
npm run lint
```

### Hardware Development
```bash
# Monitor serial output
# Arduino IDE: Tools > Serial Monitor

# Debug API calls
# Add Serial.println() statements in code
```

## 🚀 Deployment

### Backend Deployment

**Using Docker:**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

**Using systemd (Linux):**
Create `/etc/systemd/system/inventory-api.service`

### Dashboard Deployment

```bash
# Build for production
npm run build

# Deploy dist/ folder to:
# - Netlify
# - Vercel
# - GitHub Pages
# - Your own web server
```

## 📞 Support & Documentation

- **API Docs**: http://localhost:3000/docs
- **Backend README**: [backend/README.md](backend/README.md)
- **Kiosk README**: [kiosk/kiosk_main/README.md](kiosk/kiosk_main/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license information here]

## 🎓 Use Cases

- University equipment lending
- Library resource management
- Tool crib systems
- Laboratory equipment tracking
- Office supply management
- Sports equipment rental
- Medical equipment tracking

---

**Built with:** FastAPI • React • Vite • ESP32 • NFC • RFID • TypeScript • Python

**Version:** 1.0.0 (Demo)
