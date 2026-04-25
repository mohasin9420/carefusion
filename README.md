# 🏥 CareFusion — Hospital Management System

<div align="center">

![CareFusion Banner](https://img.shields.io/badge/CareFusion-Hospital%20Management-blue?style=for-the-badge&logo=heart&logoColor=white)

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Ready-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-v5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-v7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Typesense-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow?style=flat-square)](LICENSE)

**A full-stack, role-based Hospital Management System with AI-powered diagnostics, smart search, insurance claim automation, and real-time appointment workflows.**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Role-Based Modules](#-role-based-modules)
- [API Overview](#-api-overview)
- [Setup & Installation](#-setup--installation)
- [Environment Variables](#-environment-variables)
- [Docker (Typesense)](#-docker--typesense)
- [Default Credentials](#-default-credentials)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)

---

## 🌟 Overview

**CareFusion** is a comprehensive Hospital Management System designed to streamline every aspect of hospital operations. It supports **7 distinct user roles**, each with their own dedicated dashboard, and integrates modern AI capabilities for smart diagnostics, prescription assistance, and insurance claim generation.

Built with a **React + Vite frontend** and a **Node.js + Express backend**, CareFusion uses **MongoDB** for persistent storage, **Typesense** for lightning-fast search, **Google Gemini AI** for intelligent medical assistance, and **PDFKit** for automated document generation.

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with role-based access control (RBAC)
- Secure password hashing with bcryptjs
- Rate limiting, audit logging, and API key management
- Profile photo upload and management
- Email-based OTP verification (via Nodemailer)

### 🤖 AI & Smart Search
- **Google Gemini AI** integration for smart diagnosis assistance
- **Typesense** autocomplete for medicines and lab tests
- AI-powered prescription suggestions
- Smart diagnostic test recommendations

### 📅 Appointment System
- Real-time doctor availability management
- Online slot booking with time-slot conflict prevention
- Appointment rescheduling and cancellation
- QR code–based UPI payment integration for consultation fees
- Payment screenshot upload and verification workflow
- Family member booking support

### 📄 Document Generation
- Prescription PDFs with digital signatures
- Insurance claim PDF generation with watermarks
- Lab test report generation
- Billing receipts

### 🔔 Notifications
- In-app notification system for all roles
- Email notifications for appointments and OTPs

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, React Router DOM 7, Axios |
| **Backend** | Node.js, Express 5, Mongoose 9 |
| **Database** | MongoDB (local or Atlas) |
| **Search** | Typesense 26.0 (Docker) |
| **AI** | Google Gemini API |
| **Auth** | JSON Web Tokens (JWT), bcryptjs |
| **PDF** | PDFKit, pdf-parse, pdfjs-dist |
| **Email** | Nodemailer (Gmail / SMTP) |
| **QR Code** | qrcode library |
| **File Upload** | Multer |
| **Containerization** | Docker, Docker Compose |

---

## 📁 Project Structure

```
CareFusion/
├── backend/                    # Node.js + Express API Server
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── typesense.js        # Typesense client config
│   ├── controllers/            # Business logic (32 controllers)
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── appointmentController.js
│   │   ├── doctorController.js
│   │   ├── patientController.js
│   │   ├── pharmacyController.js
│   │   ├── laboratoryController.js
│   │   ├── insuranceController.js
│   │   ├── labTestController.js
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   ├── audit.js            # Audit log middleware
│   │   ├── security.js         # Rate limiting & security
│   │   ├── paymentUpload.js    # Payment screenshot upload
│   │   └── profileUpload.js    # Profile photo upload
│   ├── models/                 # Mongoose schemas (26 models)
│   │   ├── User.js
│   │   ├── Patient.js
│   │   ├── Doctor.js
│   │   ├── Appointment.js
│   │   ├── Prescription.js
│   │   ├── LabTest.js
│   │   ├── InsuranceClaim.js
│   │   ├── HospitalConfig.js
│   │   └── ...
│   ├── routes/                 # Express route definitions (18 routes)
│   ├── services/               # Reusable service layer
│   │   ├── aiService.js        # AI integration
│   │   ├── geminiService.js    # Google Gemini API
│   │   ├── emailService.js     # Email sending
│   │   ├── pdfService.js       # PDF generation
│   │   ├── prescriptionPdfService.js
│   │   ├── medicalFilePdfService.js
│   │   ├── qrCodeService.js    # QR code generation
│   │   └── slotService.js      # Slot availability logic
│   ├── utils/
│   ├── scripts/
│   ├── seedAdmin.js            # Default admin seeder
│   ├── server.js               # App entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/                   # React + Vite SPA
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Admin/          # Admin dashboard & management
│   │   │   ├── Auth/           # Login / Register pages
│   │   │   ├── Doctor/         # Doctor dashboard, prescriptions, scheduling
│   │   │   ├── Laboratory/     # Lab dashboard, test management
│   │   │   ├── Landing/        # Public home page
│   │   │   ├── Patient/        # Patient dashboard, appointments, claims
│   │   │   ├── Pharmacy/       # Pharmacy dashboard, inventory, billing
│   │   │   ├── Staff/          # Staff dashboard, appointments, insurance
│   │   │   └── Shared/         # Shared/common UI components
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Global auth state
│   │   ├── services/
│   │   │   └── api.js          # Axios API client
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml          # Typesense search engine container
├── Dockerfile                  # Production Docker build
├── package.json                # Root-level scripts
└── README.md
```

---

## 👥 Role-Based Modules

CareFusion supports **7 user roles**, each with a dedicated dashboard and feature set:

### 1. 🛡️ Super Admin
- Full system control and configuration
- User management (create, edit, deactivate staff, doctors, lab, pharmacy accounts)
- Hospital configuration (name, contact, logo, UPI payment details)
- Analytics dashboard (appointments, revenue, patient stats)
- API key management for external integrations
- Audit log viewer
- Email/SMTP settings management
- Department management

### 2. 👨‍⚕️ Doctor
- Personal dashboard with today's queue and appointments
- Live consultation modal with patient history
- AI-powered smart prescription builder (Gemini AI + Typesense medicine autocomplete)
- Diagnostic test ordering with Typesense autocomplete
- Patient history viewer (past prescriptions, lab results, notes)
- Schedule management (set weekly availability, block slots)
- Insurance claim assistant (AI-guided)
- Emergency shift management

### 3. 🧑‍⚕️ Staff / Receptionist
- Full appointment management (create, verify, reschedule, cancel)
- Payment verification (UPI screenshot review)
- Doctor availability viewer
- Insurance claim generation and management
- Block/override appointment slots
- Emergency shift scheduling

### 4. 🧪 Laboratory Technician
- Receive and process lab test requests from doctors
- Upload and manage lab test results (PDF reports)
- Lab expense tracker with analytics
- Lab-specific analytics dashboard
- Test catalog management

### 5. 💊 Pharmacy
- Inventory management (medicines, stock levels)
- Purchase order management
- Billing and prescription fulfilment
- Medicine catalog with Typesense-powered search
- Supplier management

### 6. 🤒 Patient
- Self-registration and profile management
- Online appointment booking with real-time slot selection
- UPI QR code payment for consultation fees
- Family member management (book appointments for family)
- My appointments viewer (upcoming + history)
- Insurance claim viewer and downloader
- Prescription viewer and download
- Feedback submission

### 7. 🔬 Laboratory (Separate Lab Login)
- Dedicated lab technician login
- Test result uploading and patient notification

---

## 🌐 API Overview

The backend exposes a RESTful API under `/api/`:

| Prefix | Module |
|--------|--------|
| `/api/auth` | Authentication (login, register, OTP) |
| `/api/admin` | Admin management & configuration |
| `/api/patient` | Patient profile & records |
| `/api/doctor` | Doctor profile & consultation |
| `/api/staff` | Staff operations |
| `/api/pharmacy` | Pharmacy & inventory |
| `/api/laboratory` | Lab operations & results |
| `/api/availability` | Doctor slot availability |
| `/api/appointments` | Appointment CRUD & payment |
| `/api/feedback` | Patient feedback |
| `/api/departments` | Department management |
| `/api/notifications` | In-app notifications |
| `/api/medicines` | Medicine catalog & search |
| `/api/lab-tests` | Lab test catalog & Typesense |
| `/api/diagnostic-tests` | Diagnostic test catalog |
| `/api/insurance` | Insurance claims & PDF |
| `/api/public` | Public endpoints (hospital info) |

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local installation or MongoDB Atlas)
- **Docker** (for Typesense search)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/carefusion.git
cd carefusion
```

### 2. Start Typesense (Search Engine)

```bash
docker-compose up -d
```

This starts Typesense on port `8108`.

### 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and other keys
npm run dev
```

Backend runs on **http://localhost:5000**

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173** (or nearest available port)

### 5. Seed Default Admin

```bash
cd backend
node seedAdmin.js
```

---

## 🔐 Environment Variables

Create `backend/.env` from the provided `backend/.env.example`:

```env
# Server
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/carefusion

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# AI (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Typesense Search
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_API_KEY=hospital_typesense_secret_key_2024

# Email (Nodemailer)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-specific-password
FRONTEND_URL=http://localhost:5173
```

---

## 🐋 Docker / Typesense

The project uses Docker Compose to run the **Typesense** search engine:

```bash
# Start Typesense
docker-compose up -d

# Stop Typesense
docker-compose down

# View logs
docker-compose logs typesense
```

Typesense powers:
- ⚡ Medicine autocomplete in prescriptions
- ⚡ Lab test autocomplete
- ⚡ Diagnostic test search

---

## 🔑 Default Credentials

After running `node seedAdmin.js`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@carefusion.com` | `Admin@123` |

> ⚠️ **Change the default admin password immediately after first login.**

---

## 🚢 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full production deployment instructions including:
- MongoDB Atlas setup
- Render / Railway backend deployment
- Vercel / Netlify frontend deployment
- Environment variable configuration for production

---

## 📸 Screenshots

> The system features a modern "Healthcare Modern" design system with:
> - Dark-mode compatible UI
> - Responsive card-based layouts for all screen sizes
> - Glassmorphism effects and gradient accents
> - Mobile-first responsive design

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **ISC License**.

---

<div align="center">
  <p>Built with ❤️ for modern healthcare management</p>
  <p><strong>CareFusion</strong> — Connecting Care, Simplifying Operations</p>
</div>
