# Admin Tracking Features

## Overview
Enhanced the admin panel to track and display who borrowed items and who accessed cabinets.

## Backend Changes

### 1. Enhanced Loan Endpoints (`backend/app/routes/loans.py`)

#### New Data Model
- **`LoanDetail`**: Enhanced response model that includes:
  - User information (name, email)
  - Item information (name, category)
  - All loan details (borrowed_at, due_at, returned_at, status)

#### New Endpoints

**GET `/api/loans/details/all`**
- Returns all loans with full user and item details
- Supports filtering by status
- Pagination with skip/limit parameters
- Example: `/api/loans/details/all?status_filter=active&limit=50`

**GET `/api/loans/details/active`**
- Returns only active loans with full details
- Optionally filter by specific user_uid
- Automatically updates overdue status
- Example: `/api/loans/details/active?user_uid=NFC123`

### 2. Enhanced Audit Log Endpoints (`backend/app/routes/audit_logs.py`)

#### New Data Model
- **`AuditLogDetail`**: Enhanced audit log with user name resolution

#### New Endpoint

**GET `/api/audit-logs/cabinet-access/recent`**
- Returns recent cabinet access events (unlock, lock, scan)
- Includes user names resolved from UIDs
- Configurable time window (default 24 hours)
- Example: `/api/audit-logs/cabinet-access/recent?hours=72`

## Frontend Changes

### 1. API Client Updates (`frontend/src/lib/api.ts`)

#### New Interfaces
```typescript
interface LoanDetail {
  id: number;
  user_uid: string;
  user_name: string;
  user_email: string | null;
  item_uid: string;
  item_name: string;
  item_category: string | null;
  borrowed_at: string;
  due_at: string;
  returned_at: string | null;
  status: string;
}

interface AuditLogDetail {
  id: number;
  timestamp: string;
  type: string;
  user: string;
  user_name: string | null;
  item: string | null;
  status: string;
  message: string;
  ip_address: string | null;
}
```

#### New API Functions
- `fetchLoanDetails(statusFilter?)`: Get all loan details
- `fetchActiveLoanDetails()`: Get active loans with details
- `fetchCabinetAccessLogs(hours)`: Get cabinet access history

### 2. Admin Panel UI (`frontend/src/app/admin/page.tsx`)

#### New Tab Navigation
The admin panel now has three tabs:
1. **Items** - Existing inventory management
2. **Borrowed Items** - Loan tracking
3. **Cabinet Access** - Access log monitoring

#### Borrowed Items Tab Features
- **Currently Borrowed Section**:
  - Shows all active loans
  - Displays borrower name and email
  - Shows item name and category
  - Indicates borrowed and due dates
  - Color-coded status (active/overdue)

- **Borrowing History Section**:
  - Complete loan history
  - Shows when items were borrowed and returned
  - Status indicators (returned/active/overdue)
  - Limited to most recent 50 entries

#### Cabinet Access Tab Features
- Displays last 72 hours of cabinet access events
- Shows:
  - Timestamp of access
  - User name and UID
  - Action type (unlock/lock/scan)
  - Item involved (if any)
  - Success/failure status
  - Detailed message
- Color-coded action types:
  - Blue: unlock
  - Gray: lock
  - Purple: scan

## Usage

### For Admins

1. **View Who Borrowed What**:
   - Navigate to Admin Panel
   - Click "Borrowed Items" tab
   - See active loans at the top (with overdue warnings)
   - Scroll down for full borrowing history

2. **Track Cabinet Access**:
   - Navigate to Admin Panel
   - Click "Cabinet Access" tab
   - View chronological list of who opened cabinets
   - See which items were accessed
   - Monitor for unauthorized access attempts

### Status Indicators

**Loan Status**:
- 🟡 Active - Item currently borrowed, not overdue
- 🔴 Overdue - Item should have been returned
- 🟢 Returned - Item successfully returned

**Access Status**:
- 🟢 Success - Access granted successfully
- 🔴 Failed - Access denied or error occurred

## Benefits

1. **Accountability**: Full audit trail of who borrowed what and when
2. **Security**: Track all cabinet access attempts
3. **Management**: Easy identification of overdue items
4. **Visibility**: Admin has complete oversight of inventory movement
5. **User-Friendly**: Clear, organized interface with color-coded status indicators

## Technical Notes

- All endpoints require admin authentication
- User names are resolved from UIDs in real-time
- Timestamps are stored in UTC and displayed in local time
- Cabinet access logs include scan, unlock, and lock events
- Loan status automatically updates based on due dates
