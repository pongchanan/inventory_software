# Smart Inventory Management System - Unified Run & Deploy Guide

This guide explains how to run the entire system locally with one command and how to deploy it to Railway.

## 🚀 Local Development

The project is configured as a monorepo. You can run both the **FastAPI Backend** and **Next.js Frontend** simultaneously.

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.8+)
- **npm** (comes with Node.js)

### 2. Initial Setup
Run the following command from the root directory to install all dependencies. This will automatically create a Python virtual environment in the `backend/venv` folder:

```bash
npm run install-all
```

### 3. Running the System
Start both servers with a single command:

```bash
npm run dev
```

- **Backend**: http://localhost:3000 (Uses `backend/venv`)
- **Frontend**: http://localhost:3001

---

## ☁️ Deployment to Railway

The project is ready for one-click deployment to Railway using the provided `railway.json` monorepo configuration.

### Deployment Steps:
1. **GitHub Sync**: Push your code to a GitHub repository.
2. **Railway Project**: Create a new project on [Railway](https://railway.app/).
3. **Connect Repo**: Select "Deploy from GitHub Repo" and choose this repository.
4. **Automatic Detection**: Railway will read `railway.json` and automatically create two services:
   - `backend`
   - `frontend`
5. **Environment Variables**:
   - For `frontend`, add `NEXT_PUBLIC_API_URL` pointing to your Railway backend URL.
   - For `backend`, ensure `PORT` is set to 3000 (standard for this app).

---

## 🏗️ Project Structure
- `/backend`: FastAPI Python server.
- `/frontend`: Next.js React application.
- `/kiosk`: ESP32 Hardware firmware.
- `/package.json`: Root orchestration.
- `/railway.json`: Railway monorepo config.
