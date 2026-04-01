# Email Notification Feature - Setup Guide

## Overview
Added email notification functionality to send reminders to users when they have overdue items (14+ days).

## Features Implemented

### 1. Backend Email Service (`backend/app/services/email_service.py`)
- Email sending via SMTP (configurable server/port)
- HTML and plain text email templates
- Late item reminder email function
- Admin function to send notifications to all or specific users

### 2. Backend API Endpoint (`backend/app/routes/inventory_api.py`)
- **POST** `/api/inventory/dev/send-late-reminders`
  - Dev/admin endpoint for testing email notifications
  - Optional `user_id` query parameter to send to specific user
  - Returns summary of emails sent and any errors

### 3. Backend Loan Repository (`backend/app/repositories/loan_repository.py`)
- `get_overdue_loans()` function to query overdue items for a user
- Tracks 14-day loan period
- Returns detailed loan information with days overdue

### 4. Frontend API Client (`frontend/src/lib/api_client/loans.ts`)
- `sendLateItemReminders()` function to call backend endpoint
- Exported through main API file (`frontend/src/lib/api.ts`)

### 5. Frontend UI Component (`frontend/src/app/(protected)/admin/loans/_components/SendLateRemindersButton.tsx`)
- User-friendly button in the Loans Admin page
- Shows loading state
- Displays results with list of users who received emails
- Shows error handling and email service status

### 6. Frontend Integration
- Button added to the Loans Admin page header
- Easy access for admins to manually trigger notifications

## Environment Variables Required

Add to your `.env` file:

```bash
# Email Configuration
SMTP_SERVER=smtp.gmail.com          # SMTP server (default: smtp.gmail.com)
SMTP_PORT=587                        # SMTP port (default: 587)
SENDER_EMAIL=your-email@gmail.com   # Email address to send from
SENDER_PASSWORD=your-app-password   # App password (for Gmail: https://myaccount.google.com/apppasswords)
SENDER_NAME=Inventory System        # Display name (default: Inventory System)
```

### Gmail Setup (Recommended)
1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Use the generated 16-character password as `SENDER_PASSWORD`
5. Keep the password secure (use environment variables, never commit to git)

## How to Use

### Manual Testing (Dev Mode)
1. Log in as admin
2. Navigate to "ยืม-คืน & แจ้งซ่อม" (Loans Admin page)
3. Click the **"Send Late Item Reminders"** button
4. View the results showing:
   - Total users checked
   - Number of emails sent
   - List of users with overdue items
   - Any errors that occurred

### Send to Specific User
```bash
curl -X POST "http://localhost:3000/api/inventory/dev/send-late-reminders?user_id=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## How It Works

1. **User borrows item**: Event type "borrow" recorded with timestamp
2. **14-day period**: Items are considered overdue after 14 days from borrow date
3. **Email check**: Queries all unreturned items for each user
4. **Threshold**: Items must be overdue by at least 1 day to trigger notification
5. **Email sent**: Includes item name, due date, and days overdue

## Loan Period
- Default: **14 days** (can be changed in `backend/app/repositories/loan_repository.py` - `LOAN_PERIOD_DAYS`)

## Email Template
The notification includes:
- User's name
- List of overdue items with:
  - Item name
  - Due date (formatted: YYYY-MM-DD)
  - Days overdue (calculated from current date)
- Professional HTML and plain text formats

## Files Modified/Created

### Backend
- ✅ Created: `backend/app/services/email_service.py`
- ✅ Created: `backend/app/repositories/loan_repository.py`
- ✅ Created: `backend/app/repositories/__init__.py`
- ✅ Modified: `backend/app/routes/inventory_api.py` (added endpoint)

### Frontend
- ✅ Created: `frontend/src/app/(protected)/admin/loans/_components/SendLateRemindersButton.tsx`
- ✅ Modified: `frontend/src/lib/api_client/loans.ts` (added function)
- ✅ Modified: `frontend/src/lib/api.ts` (added export)
- ✅ Modified: `frontend/src/app/(protected)/admin/loans/page.tsx` (added button to UI)

## Disabling Email Service
If SENDER_EMAIL or SENDER_PASSWORD is not set, the email service is automatically disabled and will log a warning instead of crashing.

## Testing
To test in development without sending real emails:
- Mock SMTP server: Use a service like Mailtrap.io
- Or just not set the environment variables to skip email sending

## Future Enhancements
- Scheduled task to automatically send reminders (e.g., daily cron job)
- Configurable notification frequency
- Notification preferences per user
- SMS notifications as alternative
- Notification history/audit log
