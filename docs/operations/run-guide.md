# Smart Inventory Management System - Cross-Platform Run Guide (M1-10)

Owner: F + A  
Depends on: M1-01 endpoint matrix alignment

This guide is the single source of truth for running and testing the monorepo on Windows, Linux, and macOS.

## 1. Supported Profiles

| Profile | Shell examples | Status target |
|---|---|---|
| Windows 11/10 | PowerShell 5+ / PowerShell 7+ | run + test pass |
| Ubuntu 22.04+ | bash | run + test pass |
| macOS 13+ | zsh / bash | run + test pass |

## 2. Prerequisites

- Node.js 22 LTS (minimum 18)
- npm (bundled with Node.js)
- Python 3.10+

Quick checks:

```bash
node -v
npm -v
python --version
```

On Windows, if `python` is not available, install Python and ensure either `py -3` or `python` works from terminal.

## 3. One-Time Setup (All OS)

From repository root:

```bash
npm run install-all
```

What this does:
- installs root npm packages
- installs frontend npm packages
- creates `backend/venv`
- installs backend runtime and test requirements into `backend/venv`

## 4. Run the System

From repository root:

```bash
npm run dev
```

Expected endpoints:
- Backend API: http://localhost:3000
- Backend Swagger: http://localhost:3000/docs
- Frontend: http://localhost:3001

## 5. Test Commands

### 5.1 Backend automated tests (manual excluded by default)

```bash
npm run test:backend
```

### 5.2 Backend coverage (CI-compatible)

```bash
npm run test:backend:cov
```

### 5.3 Frontend tests

```bash
cd frontend
npm test -- --coverage
```

### 5.4 Manual backend tests (explicit only)

```bash
cd backend
venv/bin/python -m pytest test/manual -v
```

Windows equivalent:

```powershell
cd backend
venv\Scripts\python.exe -m pytest test/manual -v
```

## 6. OS-Specific Quick Paths

### Windows (PowerShell)

```powershell
npm run install-all
npm run dev
```

In a second terminal:

```powershell
npm run test:backend:cov
cd frontend
npm test -- --coverage
```

### Linux (bash)

```bash
npm run install-all
npm run dev
```

In a second terminal:

```bash
npm run test:backend:cov
cd frontend
npm test -- --coverage
```

### macOS (zsh/bash)

```bash
npm run install-all
npm run dev
```

In a second terminal:

```bash
npm run test:backend:cov
cd frontend
npm test -- --coverage
```

## 7. DoD Verification Checklist (M1-10)

Use this checklist for each OS profile.

- `npm run install-all` exits with code 0
- `npm run dev` starts backend on 3000 and frontend on 3001
- `npm run test:backend:cov` exits with code 0
- `cd frontend && npm test -- --coverage` exits with code 0

Repository CI also enforces this using a 3-OS matrix workflow.

## 8. Related Commands

From repository root:

```bash
npm run dev:backend
npm run dev:frontend
npm run db:setup:sqlite
npm run kiosk:config
```
