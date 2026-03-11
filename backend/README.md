# Smart Inventory Management API

FastAPI backend for the IoT inventory system with NFC/RFID tracking, MQTT broker integration, S3 image storage, and JWT authentication.

## Features

- 🔐 JWT authentication (email/password login + NFC UID card)
- 📦 Item tracking with RFID tags and S3-hosted images
- 📊 Transaction logging (borrow/return)
- 📅 Loan management with due dates and overdue tracking
- ✅ Approval workflow for high-value items
- 📝 Comprehensive audit logging
- 🗄️ Compartment/locker status monitoring
- 📈 Dashboard statistics and analytics
- 🏥 System health monitoring
- 📡 MQTT message handling for kiosk events
- 🎯 RESTful API with automatic Swagger docs

## Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values (see .env.example for all required variables)
```

Key variables:
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite (local) or PostgreSQL (production) |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_ALGORITHM` | Algorithm for JWT (default `HS256`) |
| `AWS_*` / `S3_BUCKET_NAME` | S3-compatible storage for item images |
| `MOSQUITTO_TCP_HOST/PORT` | MQTT broker address |
| `MOSQUITTO_USER` | MQTT broker username |
| `MQTT_SUBSCRIBE_TOPICS` | Topics the backend listens on (e.g. `kiosk/#`) |
| `MQTT_PUBLISH_TOPICS` | Topics the backend publishes to (e.g. `kiosk/response`) |

### 3. Run the Server

```bash
# From backend directory
python -m app.main
```

Or with auto-reload:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload
```

Server starts at **http://localhost:3000**

## API Documentation

Once running:
- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc

## API Endpoints

### Authentication
- `POST /api/auth/login` — Login with email + password, returns JWT
- `GET /api/auth/me` — Return current authenticated user
- `POST /api/auth/kiosk/prepare_registration` — Prepare a pending registration session (frontend → backend)
- `GET /api/auth/kiosk/status/{session_id}` — Poll registration status (frontend polls until kiosk scans card)

### Users
- `POST /api/users/` — Create user
- `GET /api/users/` — List all users
- `GET /api/users/{uid}` — Get user by NFC UID
- `PUT /api/users/{uid}` — Update user
- `DELETE /api/users/{uid}` — Delete user

### Items
- `POST /api/items/` — Create item
- `GET /api/items/` — List all items (filter by availability)
- `GET /api/items/{uid}` — Get item by RFID UID
- `PUT /api/items/{uid}` — Update item
- `DELETE /api/items/{uid}` — Delete item
- `POST /api/items/{uid}/upload-image` — Upload item image to S3

### Transactions
- `POST /api/transactions/` — Record transaction
- `GET /api/transactions/` — List transactions (with filters)
- `GET /api/transactions/{id}` — Get specific transaction
- `DELETE /api/transactions/{id}` — Delete transaction

### Loans
- `POST /api/loans/` — Create loan (borrow item)
- `GET /api/loans/` — List loans (with filters)
- `GET /api/loans/active` — All active loans
- `GET /api/loans/overdue` — Overdue loans
- `GET /api/loans/user/{user_uid}` — Loans for a specific user
- `GET /api/loans/{loan_id}` — Get specific loan
- `POST /api/loans/{loan_id}/return` — Mark loan as returned

### Approvals
- `POST /api/approvals/` — Submit approval request
- `GET /api/approvals/` — List all approvals
- `GET /api/approvals/pending` — Pending approvals
- `GET /api/approvals/{id}` — Get specific approval
- `POST /api/approvals/{id}/approve` — Approve (admin)
- `POST /api/approvals/{id}/reject` — Reject (admin)

### Compartments
- `POST /api/compartments/` — Create compartment
- `GET /api/compartments/` — List compartments
- `GET /api/compartments/{locker_number}` — Get compartment
- `PUT /api/compartments/{locker_number}` — Update compartment
- `DELETE /api/compartments/{locker_number}` — Delete compartment

### Audit Logs
- `POST /api/audit-logs/` — Create log entry
- `GET /api/audit-logs/` — List logs
- `GET /api/audit-logs/recent?hours=24` — Recent logs
- `GET /api/audit-logs/{id}` — Get specific entry

### Statistics
- `GET /api/stats/dashboard` — Full dashboard stats
- `GET /api/stats/user/{user_uid}` — Per-user stats
- `GET /api/stats/system-health` — System health

## MQTT Kiosk Integration

The backend subscribes to kiosk topics and publishes responses via `app/mqtt.py` + `app/mqtt_handlers.py`.

| Topic (kiosk publishes) | Handler | Payload |
|---|---|---|
| `kiosk/open_cabinet` | `open_cabinet` | `{"rfid": "<NFC UID>"}` |
| `kiosk/register_card` | `register_card` | `{"uid": "<RFID UID>"}` |
| `kiosk/heartbeat` | `handle_heartbeat` | `{"status": "alive", "uptime_ms": ...}` |

| Topic (backend publishes) | When |
|---|---|
| `kiosk/response` | After every handler — `{"status": "ok|error", "message": "..."}` |

### Registration flow
1. Frontend `POST /api/auth/kiosk/prepare_registration` → gets back `session_id`
2. Backend (TODO) publishes to kiosk to start waiting for card scan
3. User scans card at kiosk → kiosk publishes `kiosk/register_card {uid}`
4. `register_card` handler creates the user, marks session as `success`
5. Frontend polls `GET /api/auth/kiosk/status/{session_id}` → receives JWT + user on success

## Database

Defaults to SQLite (`inventory.db`) for local development. Set `DATABASE_URL` to a PostgreSQL URL for production.

To reset: delete `inventory.db` and restart the server.

## Database Tables

| Table | Description |
|---|---|
| `users` | NFC UID, name, email, role, authorization status |
| `items` | RFID UID, name, category, availability, S3 image URL |
| `transactions` | Raw borrow/return events from kiosk |
| `loans` | Active/returned loans with due dates |
| `approvals` | Admin approval requests |
| `audit_logs` | System activity trail |
| `compartments` | Physical locker status |


## Features

- 🔐 User authentication via NFC UID
- 📦 Item tracking with RFID tags
- 📊 Transaction logging (borrow/return)
- 📅 Loan management with due dates and overdue tracking
- ✅ Approval workflow for high-value items
- 📝 Comprehensive audit logging
- 🗄️ Compartment/locker status monitoring
- 📈 Dashboard statistics and analytics
- 🏥 System health monitoring
- 🎯 RESTful API with automatic docs
- 💾 SQLite database (easy for demo)
- 🔄 CORS enabled for React dashboards

## Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env if needed (defaults work for demo)
```

### 3. Run the Server

```bash
# From backend directory
python -m app.main
```

Or with uvicorn directly:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload
```

Server will start at: **http://localhost:3000**

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc

## API Endpoints

### Users
- `POST /api/users/` - Create new user
- `GET /api/users/{uid}` - Get user by UID (kiosk auth check)
- `GET /api/users/` - List all users
- `PUT /api/users/{uid}` - Update user
- `DELETE /api/users/{uid}` - Delete user

### Items
- `POST /api/items/` - Create new item
- `GET /api/items/{uid}` - Get item by UID
- `GET /api/items/` - List all items (filter by availability)
- `PUT /api/items/{uid}` - Update item
- `DELETE /api/items/{uid}` - Delete item

### Transactions
- `POST /api/transactions/` - Record transaction (kiosk)
- `GET /api/transactions/` - List transactions (with filters)
- `GET /api/transactions/{id}` - Get specific transaction
- `DELETE /api/transactions/{id}` - Delete transaction

### Loans (Borrow/Return Tracking)
- `POST /api/loans/` - Create new loan (borrow item)
- `GET /api/loans/active` - Get all active loans (optional user filter)
- `GET /api/loans/overdue` - Get overdue loans
- `GET /api/loans/user/{user_uid}` - Get loans for specific user
- `POST /api/loans/{loan_id}/return` - Mark loan as returned
- `GET /api/loans/` - List all loans with filtering
- `GET /api/loans/{loan_id}` - Get specific loan

### Approvals (High-Value Items)
- `POST /api/approvals/` - Submit approval request
- `GET /api/approvals/pending` - Get pending approval requests
- `POST /api/approvals/{id}/approve` - Approve request (admin)
- `POST /api/approvals/{id}/reject` - Reject request (admin)
- `GET /api/approvals/` - List all approvals (with filters)
- `GET /api/approvals/{id}` - Get specific approval request

### Audit Logs
- `POST /api/audit-logs/` - Create audit log entry
- `GET /api/audit-logs/recent?hours=24` - Get recent logs
- `GET /api/audit-logs/` - List all logs (with filters)
- `GET /api/audit-logs/{id}` - Get specific log entry

### Compartments/Lockers
- `POST /api/compartments/` - Create compartment
- `GET /api/compartments/` - List compartments (filter by floor/status)
- `GET /api/compartments/{locker_number}` - Get specific compartment
- `PUT /api/compartments/{locker_number}` - Update compartment status
- `DELETE /api/compartments/{locker_number}` - Delete compartment

### Statistics & Dashboard
- `GET /api/stats/dashboard` - Complete dashboard statistics
- `GET /api/stats/user/{user_uid}` - User-specific statistics
- `GET /api/stats/system-health` - System health status

## Testing with curl

### Add a test user:
```bash
curl -X POST http://localhost:3000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "A1B2C3D4",
    "name": "Test User",
    "email": "test@example.com",
    "authorized": true
  }'
```

### Check user authorization (kiosk call):
```bash
curl http://localhost:3000/api/users/A1B2C3D4
```

### Add an item:
```bash
curl -X POST http://localhost:3000/api/items/ \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "ITEM001",
    "name": "Screwdriver Set",
    "category": "Tools",
    "available": true
  }'
```

### Record a transaction:
```bash
curl -X POST http://localhost:3000/api/transactions/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_uid": "A1B2C3D4",
    "item_uid": "ITEM001",
    "action": "borrow"
  }'
```

### Create a loan (borrow item):
```bash
curl -X POST http://localhost:3000/api/loans/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_uid": "A1B2C3D4",
    "item_uid": "ITEM001",
    "due_at": "2026-02-10T18:00:00"
  }'
```

### Get active loans for a user:
```bash
curl http://localhost:3000/api/loans/active?user_uid=A1B2C3D4
```

### Submit approval request:
```bash
curl -X POST http://localhost:3000/api/approvals/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_uid": "A1B2C3D4",
    "item_uid": "ITEM001",
    "reason": "Need for project",
    "priority": "high",
    "duration_days": 3
  }'
```

### Get dashboard statistics:
```bash
curl http://localhost:3000/api/stats/dashboard
```

### Create audit log:
```bash
curl -X POST http://localhost:3000/api/audit-logs/ \
  -H "Content-Type: application/json" \
  -d '{
    "type": "unlock",
    "user": "Alex Johnson",
    "item": "USB-C Hub",
    "status": "success",
    "message": "RFID unlock successful"
  }'
```

## Database

SQLite database file: `inventory.db` (created automatically)

To reset database, simply delete `inventory.db` and restart server.

## Configure ESP32 Kiosk

In your `kiosk_main.ino`, update:

```cpp
const char *serverUrl = "http://YOUR_COMPUTER_IP:3000";
```

Replace `YOUR_COMPUTER_IP` with your computer's local IP address (e.g., `192.168.1.100`).
Data Models

### Database Tables
- **users** - User accounts with NFC UIDs and authorization status
- **items** - Inventory items with RFID tags and availability status
- **transactions** - Raw transaction logs from kiosk
- **loans** - Active/returned loans with due dates
- **approvals** - Approval requests for high-value items
- **audit_logs** - System activity logs
- **compartments** - Physical locker/compartment status

### Relationships
- Loans link users → items with time tracking
- Approvals require admin review before loan creation
- Audit logs track all system activities
- Compartments track physical storage locations

## Dashboard Integration

The API supports both admin and user React dashboards:

**User Dashboard Features:**
- View active loans with countdown timers
- Submit approval requests for high-value items
- Browse available inventory
- Track personal borrowing history

**Admin Dashboard Features:**
- User management and access control
- Approval queue processing
- Real-time audit logs
- Compartment/locker monitoring
- System health dashboard
- Analytics and statistics

## Next Steps

1. ✅ Run `python ../scripts/seed/seed_data.py` to add sample data
2. ✅ Test endpoints at http://localhost:3000/docs
3. 🔧 Configure ESP32 kiosk with server IP
4. 🎨 Connect React dashboards to API
5. 🧪 Test end-to-end workflow
6. 🚀 Deploy to production server

## Production Deployment

For production use:
1. Switch to PostgreSQL database
2. Add authentication middleware (JWT tokens)
3. Enable HTTPS/SSL
4. Set up proper CORS origins (remove "*")
5. Add rate limiting
6. Configure environment variables properly
7. Set up logging and monitoring
## Next Steps

1. Add sample users and items
2. Test with curl or Postman
3. Configure kiosk with server IP
4. Test end-to-end with hardware
5. Connect React dashboards
