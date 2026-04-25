# 🏥 CareFusion Hospital Management System — Deployment Guide

> **Stack Overview:** Node.js (Express) Backend · React 19 + Vite Frontend · MongoDB · Typesense Search Engine

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Structure](#2-project-structure)
3. [Environment Variables Setup](#3-environment-variables-setup)
4. [Option A — Local Development Setup](#4-option-a--local-development-setup)
5. [Option B — Production (Single Server / VPS)](#5-option-b--production-single-server--vps)
6. [Option C — Docker Deployment](#6-option-c--docker-deployment)
7. [Typesense Setup](#7-typesense-setup)
8. [Seeding the Admin User](#8-seeding-the-admin-user)
9. [Default Login Credentials](#9-default-login-credentials)
10. [API Routes Reference](#10-api-routes-reference)
11. [Common Issues & Fixes](#11-common-issues--fixes)
12. [Cloud Deployment (Render / Railway / VPS)](#12-cloud-deployment-render--railway--vps)

---

## 1. Prerequisites

Install the following tools before you begin:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18 or v20 LTS | https://nodejs.org |
| **npm** | v9+ (comes with Node) | — |
| **MongoDB** | v6+ | https://www.mongodb.com/try/download/community |
| **Docker** *(optional)* | Latest | https://docs.docker.com/get-docker/ |
| **Git** | Any | https://git-scm.com |

> **Windows Users:** Make sure all of the above are added to your **system PATH** so commands like `node`, `npm`, `mongod`, and `docker` work in PowerShell / CMD.

---

## 2. Project Structure

```
Hospital/
├── backend/                    # Node.js + Express API server
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── typesense.js        # Typesense client config
│   ├── controllers/            # Route handler logic
│   ├── middleware/             # Auth & validation middleware
│   ├── models/                 # Mongoose data models (26 models)
│   ├── routes/                 # Express route definitions (18 routes)
│   ├── services/               # Business logic services
│   ├── uploads/                # Uploaded files (payment screenshots, etc.)
│   ├── utils/                  # Utility helpers
│   ├── seedAdmin.js            # Script to seed default admin
│   ├── server.js               # App entry point
│   ├── .env                    # 🔒 Your actual env file (never commit this)
│   └── package.json
│
├── frontend/                   # React 19 + Vite app
│   ├── src/
│   │   ├── components/         # Role-based dashboards (Admin, Doctor, Patient, etc.)
│   │   ├── context/            # React context providers
│   │   ├── services/           # Axios API service layer
│   │   └── utils/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml          # Typesense via Docker
├── Dockerfile                  # Full-stack Docker build
└── DEPLOYMENT_GUIDE.md         # ← This file
```

---

## 3. Environment Variables Setup

### Backend `.env` file

Create (or update) the file at `backend/.env`:

```env
# ─────────────────────────────────────────────
# SERVER
# ─────────────────────────────────────────────
PORT=5000

# ─────────────────────────────────────────────
# MONGODB
# ─────────────────────────────────────────────
# Local MongoDB:
MONGO_URI=mongodb://localhost:27017/hospital_management

# MongoDB Atlas (Cloud):
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hospital_management?retryWrites=true&w=majority

# ─────────────────────────────────────────────
# JWT
# ─────────────────────────────────────────────
JWT_SECRET=change_this_to_a_long_random_secret_in_production

# ─────────────────────────────────────────────
# TYPESENSE
# ─────────────────────────────────────────────
TYPESENSE_API_KEY=hospital_typesense_secret_key_2024
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http

# ─────────────────────────────────────────────
# EMAIL (optional — for OTP / notifications)
# ─────────────────────────────────────────────
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password

# Frontend URL (used in email links)
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **Never commit `.env` to Git.** It is already in `.gitignore`.

### Frontend environment (optional)

If you need to point the frontend at a different backend URL, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Then update your Axios base URL in `frontend/src/services/` to use `import.meta.env.VITE_API_URL`.

---

## 4. Option A — Local Development Setup

This is the quickest way to run the project on your local machine for development.

### Step 1 — Clone the repository

```bash
git clone <your-repo-url>
cd Hospital
```

### Step 2 — Start MongoDB

**Windows (if MongoDB is installed locally):**
```powershell
# Start MongoDB service
net start MongoDB

# OR run manually
mongod --dbpath "C:\data\db"
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

**Using MongoDB Atlas (cloud):** Skip this step and replace `MONGO_URI` in `.env`.

### Step 3 — Start Typesense (via Docker)

```bash
# From the project root:
docker-compose up -d
```

This starts Typesense on port **8108** in the background.

> If you don't have Docker, see [Section 7 — Typesense Setup (No Docker)](#7-typesense-setup).

### Step 4 — Install & start the Backend

```powershell
cd backend
npm install
npm run dev        # Development mode with nodemon (auto-restart)
# OR
npm start          # Production mode
```

Backend will run at: **http://localhost:5000**

### Step 5 — Install & start the Frontend

```powershell
cd ../frontend
npm install
npm run dev
```

Frontend will run at: **http://localhost:5173**

### Step 6 — Seed the Admin User (first time only)

```powershell
cd backend
npm run seed
```

Or run manually:
```powershell
node seedAdmin.js
```

This creates: **admin@hospital.com / admin123**

---

## 5. Option B — Production (Single Server / VPS)

Use this approach when deploying to a Linux VPS (Ubuntu/Debian).

### Step 1 — Install dependencies on the server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install MongoDB
sudo apt install -y mongodb
sudo systemctl enable mongod
sudo systemctl start mongod
```

### Step 2 — Clone the project

```bash
git clone <your-repo-url> /var/www/hospital
cd /var/www/hospital
```

### Step 3 — Create `.env`

```bash
cd backend
nano .env
# Paste your environment variables and save
```

### Step 4 — Build the Frontend

```bash
cd /var/www/hospital/frontend
npm install
npm run build
# This creates frontend/dist/
```

The backend's `server.js` serves the frontend build from `../frontend/build`. Vite outputs to `dist`, so create a symlink or update `server.js`:

```javascript
// In server.js — change line 53 from "build" to "dist":
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});
```

### Step 5 — Install backend dependencies

```bash
cd /var/www/hospital/backend
npm install --omit=dev
```

### Step 6 — Seed admin user

```bash
node seedAdmin.js
```

### Step 7 — Start backend with PM2

```bash
cd /var/www/hospital/backend
pm2 start server.js --name carefusion-backend
pm2 save
pm2 startup   # Follow the instructions to auto-start on reboot
```

### Step 8 — Setup Typesense (Linux)

```bash
# Download Typesense binary
wget https://dl.typesense.org/releases/26.0/typesense-server-26.0-linux-amd64.tar.gz
tar -xzf typesense-server-26.0-linux-amd64.tar.gz
sudo mv typesense-server /usr/bin/

# Create data dir
sudo mkdir -p /var/typesense-data

# Start with PM2
pm2 start "typesense-server --data-dir /var/typesense-data --api-key=hospital_typesense_secret_key_2024 --enable-cors" --name carefusion-typesense
pm2 save
```

### Step 9 — Setup Nginx reverse proxy (optional but recommended)

```nginx
# /etc/nginx/sites-available/carefusion
server {
    listen 80;
    server_name yourdomain.com;

    # Serve backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve static uploads
    location /uploads/ {
        proxy_pass http://localhost:5000;
    }

    # Serve frontend (React SPA)
    location / {
        proxy_pass http://localhost:5000;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/carefusion /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 10 — Enable HTTPS with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 6. Option C — Docker Deployment

> Build and run the entire application in a container.

### Build the Docker image

```bash
# From the project root
docker build -t carefusion:latest .
```

### Run the container

```bash
docker run -d \
  --name carefusion-app \
  -p 5000:5000 \
  -p 8108:8108 \
  -e MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/hospital_management" \
  -e JWT_SECRET="your_secret_here" \
  -e TYPESENSE_API_KEY="hospital_typesense_secret_key_2024" \
  -e EMAIL_USER="your@gmail.com" \
  -e EMAIL_PASS="your-app-password" \
  carefusion:latest
```

> ⚠️ **Note:** The Dockerfile has Typesense version `0.25.2` but `docker-compose.yml` uses `26.0`. Update the Dockerfile to use version **26.0** for consistency:
>
> ```dockerfile
> # Change this line in Dockerfile:
> RUN wget https://dl.typesense.org/releases/26.0/typesense-server-26.0-linux-amd64.tar.gz \
>     && tar -xzf typesense-server-26.0-linux-amd64.tar.gz \
>     && mv typesense-server /usr/bin/typesense-server
> ```

### Typesense only (dev) via Docker Compose

```bash
docker-compose up -d
# Starts Typesense on port 8108
# MongoDB still runs locally
```

---

## 7. Typesense Setup

Typesense powers the **autocomplete search** for lab tests, medicines, and patients.

### Option A — Docker (Recommended)

```bash
# From project root:
docker-compose up -d

# Check it's running:
curl http://localhost:8108/health
# Expected: {"ok":true}
```

### Option B — Windows (No Docker)

1. Download from: https://typesense.org/docs/guide/install-typesense.html
2. Extract the `.zip`
3. Run:
```powershell
.\typesense-server.exe `
  --data-dir=C:\typesense-data `
  --api-key=hospital_typesense_secret_key_2024 `
  --enable-cors
```

### Option C — Linux / macOS (Binary)

```bash
wget https://dl.typesense.org/releases/26.0/typesense-server-26.0-linux-amd64.tar.gz
tar -xzf typesense-server-26.0-linux-amd64.tar.gz
./typesense-server \
  --data-dir=/tmp/typesense-data \
  --api-key=hospital_typesense_secret_key_2024 \
  --enable-cors
```

### Verify Typesense

```bash
curl "http://localhost:8108/health"
# {"ok":true}
```

---

## 8. Seeding the Admin User

Run this **once** after first deployment:

```bash
cd backend
node seedAdmin.js
```

Or use the npm script:
```bash
npm run seed
```

The server also auto-creates a default admin on first startup via `utils/createDefaultAdmin.js`.

---

## 9. Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@hospital.com | admin123 |

> ⚠️ **Change the admin password immediately after first login in production!**

### Roles in the system

| Role | Dashboard |
|------|-----------|
| Admin | Manage users, departments, hospital config, payments |
| Doctor | View schedule, prescriptions, patient queue |
| Patient | Book appointments, view history, insurance |
| Staff | Manage records, insurance claims |
| Pharmacy | Manage medicines, prescriptions, stock |
| Laboratory | Lab tests, reports, diagnostics |

---

## 10. API Routes Reference

All routes are prefixed with `/api`.

| Route | Module |
|-------|--------|
| `/api/auth` | Login, Register, OTP |
| `/api/admin` | Admin management |
| `/api/patient` | Patient operations |
| `/api/doctor` | Doctor operations |
| `/api/staff` | Staff operations |
| `/api/pharmacy` | Pharmacy & medicines |
| `/api/laboratory` | Lab tests & reports |
| `/api/appointments` | Booking & scheduling |
| `/api/availability` | Doctor availability |
| `/api/feedback` | Patient feedback |
| `/api/departments` | Department management |
| `/api/notifications` | System notifications |
| `/api/medicines` | Medicine catalog |
| `/api/lab-tests` | Lab test catalog |
| `/api/diagnostic-tests` | Diagnostic catalog |
| `/api/insurance` | Insurance claims |
| `/api/public` | Public endpoints |
| `/uploads/*` | Static file uploads |

---

## 11. Common Issues & Fixes

### ❌ `Cannot connect to MongoDB`
```
Error: MongoServerError: connect ECONNREFUSED
```
**Fix:**
- Ensure MongoDB is running: `net start MongoDB` (Windows) or `sudo systemctl start mongod` (Linux)
- Check `MONGO_URI` in `.env` matches your actual MongoDB address

---

### ❌ `Typesense connection refused`
```
Error: ECONNREFUSED 127.0.0.1:8108
```
**Fix:**
- Run `docker-compose up -d` from the project root
- Or start Typesense manually (see Section 7)
- The backend will still work — search just won't function

---

### ❌ Frontend shows blank page / 404 on refresh
**Fix:** Update `server.js` to use the correct build directory:
```javascript
// Vite builds to "dist", not "build":
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});
```

---

### ❌ CORS errors in browser
**Fix:** In `server.js`, configure CORS with your frontend URL:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

---

### ❌ File uploads not working
**Fix:** Make sure the `uploads/` folder exists:
```bash
mkdir -p backend/uploads
```

---

### ❌ Email not sending
**Fix:**
- For Gmail: Enable **2-Factor Auth** and create an **App Password** at https://myaccount.google.com/apppasswords
- Add `EMAIL_USER` and `EMAIL_PASS` to `.env`

---

### ❌ Port 5000 already in use
```powershell
# Windows — find and kill the process:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## 12. Cloud Deployment (Render / Railway / VPS)

### Deploy Backend on Render

1. Push your code to GitHub
2. Go to https://render.com → **New Web Service**
3. Connect your repository
4. Set:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
5. Add all environment variables from Section 3
6. Use **MongoDB Atlas** for cloud database

### Deploy Frontend on Vercel / Netlify

1. Go to https://vercel.com → **New Project**
2. Connect your repository
3. Set:
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`

### Use MongoDB Atlas (Cloud DB)

1. Create free account at https://cloud.mongodb.com
2. Create a cluster, database user, and whitelist IP `0.0.0.0/0`
3. Copy the connection string and use it as `MONGO_URI` in `.env`

### Use Typesense Cloud

1. Sign up at https://cloud.typesense.org
2. Create a cluster
3. Update `.env`:
```env
TYPESENSE_HOST=your-cluster.typesense.net
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=your-typesense-cloud-key
```

---

## 🚀 Quick Start Checklist

```
[ ] MongoDB is running (local) OR Atlas URI is set
[ ] Typesense is running (docker-compose up -d)
[ ] backend/.env is created with all required variables
[ ] cd backend && npm install && npm run seed
[ ] cd backend && npm start (or npm run dev)
[ ] cd frontend && npm install && npm run dev
[ ] Open http://localhost:5173
[ ] Login with admin@hospital.com / admin123
[ ] Change admin password!
```

---

*Generated for CareFusion Hospital Management System · April 2026*
