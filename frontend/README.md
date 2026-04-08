# Inventory Software — Frontend

Next.js application for the inventory management system. Provides student item browsing, borrowing management, damage reporting, and a full admin dashboard.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** with TypeScript
- **Tailwind CSS v4**
- **Lucide React** for icons
- **Jest** + Testing Library for tests

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:system` | Run system tests only |

## Routes

### User Pages

| Route | Description |
|---|---|
| `/` | Home — Item catalog with search, filters, sorting, pagination |
| `/login` | Sign in with email/password |
| `/register` | 3-step registration with NFC card |
| `/borrows` | Active borrows and history (Active/History tabs) |
| `/damage-reports` | Submit and track damage reports |

### Admin Pages

| Route | Description |
|---|---|
| `/admin/dashboard` | Stats overview, most borrowed/damaged charts |
| `/admin/assets` | Item management — enroll, adjust quantity, upload images |
| `/admin/borrowings` | All borrowings — Active/Returned tabs with pagination |
| `/admin/damage-reports` | Review and approve/deny reports, Excel export |
| `/admin/users` | User list — role/blacklist management, view borrows |
| `/admin/cabinet-logs` | Cabinet session history with close images |

## Project Structure

```
src/
├── app/                 # Pages (App Router)
│   ├── page.tsx         # Home
│   ├── login/
│   ├── register/
│   ├── borrows/
│   ├── damage-reports/
│   └── admin/
│       ├── dashboard/
│       ├── assets/
│       ├── borrowings/
│       ├── damage-reports/
│       ├── users/
│       └── cabinet-logs/
├── components/
│   ├── layout/          # AppShell, Sidebar
│   └── ui/              # Pagination, shared UI
├── lib/
│   ├── api.ts           # Fetch wrapper with JWT auth
│   ├── auth-context.tsx # AuthProvider, useAuth hook
│   └── types.ts         # TypeScript interfaces
├── context/
├── domain/
├── repositories/
└── services/
tests/
├── setup.ts             # Jest setup (mocks, matchers)
├── unit/                # Unit tests
└── system/              # System/integration tests
```

## Authentication

JWT Bearer tokens stored in `localStorage` (`inv_token`). The `AuthProvider` context handles login, logout, hydration, and role-based access. Admin routes are protected by `AppShell`.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
