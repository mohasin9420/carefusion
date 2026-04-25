# 📤 GitHub Push Guide — CareFusion

This document lists exactly **which files to push** and **which to exclude**, plus step-by-step commands to push to GitHub.

---

## ✅ Files to PUSH (Include)

### Root Level
```
README.md                           ✅ Project overview (regenerated)
GITHUB_PUSH_GUIDE.md                ✅ This file
DEPLOYMENT_GUIDE.md                 ✅ Production deployment steps
docker-compose.yml                  ✅ Typesense Docker config
Dockerfile                          ✅ Production Docker build
package.json                        ✅ Root scripts (if any)
ADMIN_MODULE_COMPLETE.md            ✅ Module documentation
LABORATORY_MODULE_COMPLETE.md       ✅ Module documentation
PATIENT_MODULE_COMPLETE.md          ✅ Module documentation
PHARMACY_MODULE_COMPLETE.md         ✅ Module documentation
SECURITY_AND_AI_COMPLETE.md        ✅ Feature documentation
NEW_FEATURES_IMPLEMENTED.md        ✅ Changelog
QUICK_START.md                      ✅ Quick start guide
CareFusion_Project_Report.html      ✅ Visual project report
PROJECT_INFO_METHODOLOGY.html       ✅ Project methodology
DEFAULT_ADMIN_CREDENTIALS.md        ✅ (Review - contains seed-only info)
DOCTOR_QUEUE_SETUP.md               ✅ Setup docs
TYPESENSE_SETUP.md                  ✅ Typesense setup guide
TYPESENSE_LAB_TESTS_SETUP.md       ✅ Lab tests Typesense docs
LAB_TESTS_API.md                    ✅ API docs
LAB_TESTS_AUTOCOMPLETE_FRONTEND.md ✅ Frontend docs
PATIENT_AUTH_SETUP.md               ✅ Auth setup docs
QUICK_START_LAB_TESTS.md            ✅ Quick start
```

### Backend — `backend/`
```
backend/server.js                   ✅ App entry point
backend/package.json                ✅ Dependencies
backend/seedAdmin.js                ✅ Admin seeder script
backend/checkAdmin.js               ✅ Admin check utility
backend/cleanupUsers.js             ✅ Cleanup utility
backend/listPatients.js             ✅ Utility script

backend/.env.example                ✅ Environment template (NO secrets)
backend/.env.email.example          ✅ Email env template (NO secrets)
backend/.gitignore                  ✅ Git ignore rules

backend/config/db.js                ✅ MongoDB connection
backend/config/typesense.js         ✅ Typesense config

backend/controllers/*.js            ✅ ALL 32 controllers
backend/models/*.js                 ✅ ALL 26 Mongoose models
backend/routes/*.js                 ✅ ALL 18 route files
backend/middleware/*.js             ✅ ALL 5 middleware files
backend/services/*.js               ✅ ALL 8 service files
backend/utils/                      ✅ Utility helpers
backend/scripts/                    ✅ Utility scripts
```

### Frontend — `frontend/`
```
frontend/index.html                 ✅ App HTML shell
frontend/vite.config.js             ✅ Vite configuration
frontend/eslint.config.js           ✅ ESLint configuration
frontend/package.json               ✅ Frontend dependencies
frontend/.gitignore                 ✅ Git ignore
frontend/.gitattributes             ✅ Git attributes

frontend/public/                    ✅ Static public assets

frontend/src/main.jsx               ✅ React entry
frontend/src/App.jsx                ✅ App router
frontend/src/App.css                ✅ Global styles
frontend/src/index.css              ✅ Global CSS variables / tokens

frontend/src/context/AuthContext.jsx        ✅ Auth context
frontend/src/services/api.js                ✅ Axios API client

frontend/src/components/Admin/             ✅ Admin components
frontend/src/components/Auth/              ✅ Auth components
frontend/src/components/Doctor/            ✅ Doctor components
frontend/src/components/Laboratory/        ✅ Lab components
frontend/src/components/Landing/           ✅ Landing page
frontend/src/components/Patient/           ✅ Patient components
frontend/src/components/Pharmacy/          ✅ Pharmacy components
frontend/src/components/Staff/             ✅ Staff components
frontend/src/components/Shared/            ✅ Shared components
frontend/src/utils/                        ✅ Frontend utilities
frontend/src/assets/                       ✅ Images and icons
```

---

## ❌ Files to NEVER Push (Exclude)

> These are already (or should be) in `.gitignore`. Double-check before pushing!

```
# Secret / Sensitive
backend/.env                        ❌ NEVER — contains real secrets!

# Dependencies (auto-installed by npm install)
node_modules/                       ❌ Root node_modules
backend/node_modules/               ❌ Backend node_modules
frontend/node_modules/              ❌ Frontend node_modules

# Build artifacts
frontend/dist/                      ❌ Vite build output
frontend/build/                     ❌ Build output

# Uploads (user-generated content, may contain PHI)
backend/uploads/                    ❌ User uploaded files (payment screenshots, reports)
backend/tmp/                        ❌ Temporary files

# Log files
backend/error_log.txt               ❌ Error logs
backend/pdf_extraction.log          ❌ Processing logs
backend/import_output.txt           ❌ Import logs

# Database
data/                               ❌ Any local DB data files

# OS / IDE
.DS_Store                           ❌
Thumbs.db                           ❌
.vscode/                            ❌ (optional, can include settings.json)
```

---

## 🔧 Check Your .gitignore Files

Make sure `backend/.gitignore` contains at least:

```gitignore
node_modules/
.env
uploads/
tmp/
*.log
error_log.txt
pdf_extraction.log
import_output.txt
```

Make sure `frontend/.gitignore` contains at least:

```gitignore
node_modules/
dist/
build/
.env
.env.local
```

---

## 🚀 Step-by-Step: Push to GitHub

### Step 1 — Initialize Git (if not already done)
```bash
cd d:\s\Hospital\Hospital
git init
```

### Step 2 — Create a Repository on GitHub
1. Go to [https://github.com/new](https://github.com/new)
2. Name it: `carefusion` (or your preferred name)
3. Set to **Public** or **Private**
4. **Do NOT** initialize with README or .gitignore (you already have them)
5. Click **Create Repository**

### Step 3 — Add Remote Origin
```bash
git remote add origin https://github.com/YOUR_USERNAME/carefusion.git
```

### Step 4 — Stage All Files
```bash
git add .
```

### Step 5 — Verify What Will Be Committed
```bash
git status
```

> ⚠️ **Check this carefully!** Make sure `backend/.env` and `node_modules/` are NOT listed in green (staged files). If they are, your `.gitignore` is missing entries.

### Step 6 — Make the First Commit
```bash
git commit -m "🚀 Initial commit: CareFusion Hospital Management System

- Role-based system: Admin, Doctor, Staff, Patient, Pharmacy, Lab
- AI-powered prescriptions with Gemini integration
- Typesense full-text search for medicines & lab tests
- Appointment booking with UPI QR payment
- Insurance claim PDF generation
- Mobile-responsive Healthcare Modern UI"
```

### Step 7 — Push to GitHub
```bash
git branch -M main
git push -u origin main
```

---

## 🔁 Subsequent Pushes (After Changes)

```bash
git add .
git commit -m "✨ feat: describe your change here"
git push
```

---

## ⚠️ Important Security Warnings

> [!CAUTION]
> **NEVER push `backend/.env`** — it contains your MongoDB URI, JWT secret, Gemini API key, and email credentials. These are real secrets that must stay private.

> [!WARNING]
> **Never push `backend/uploads/`** — this folder may contain patient payment screenshots and medical documents (PHI — Protected Health Information).

> [!IMPORTANT]
> After pushing, go to your GitHub repository → **Settings** → **Secrets and Variables** → **Actions** if you plan to use GitHub Actions for CI/CD.

---

## 📝 Recommended `.env.example` Template to Keep Updated

Whenever you add a new environment variable, update `backend/.env.example` so other developers know what's needed:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/carefusion
JWT_SECRET=your_super_secret_jwt_key_change_this
GEMINI_API_KEY=your_google_gemini_api_key
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_API_KEY=hospital_typesense_secret_key_2024
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-specific-password
FRONTEND_URL=http://localhost:5173
```

---

## 📦 Summary Table

| Category | Action |
|----------|--------|
| `backend/` source code | ✅ Push |
| `frontend/src/` source code | ✅ Push |
| `*.md` documentation | ✅ Push |
| `docker-compose.yml` | ✅ Push |
| `Dockerfile` | ✅ Push |
| `.env.example` files | ✅ Push |
| `backend/.env` (real env) | ❌ NEVER |
| `node_modules/` | ❌ Exclude |
| `frontend/dist/` | ❌ Exclude |
| `backend/uploads/` | ❌ Exclude |
| `backend/*.log` / `*.txt` logs | ❌ Exclude |
| `data/` folder | ❌ Exclude |
