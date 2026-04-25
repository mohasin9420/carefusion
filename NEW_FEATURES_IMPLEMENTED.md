# CareFusion - New Features Implemented

This document lists the **newly implemented** features that were added on top of the existing CareFusion codebase. Existing features (login, appointments, prescriptions, lab tests, etc.) were **not** modified unless required for integration.

---

## 1. Prescription Enhancements

### Prescription ID & Digital Signature
- **Unique Prescription ID**: Auto-generated as `RX-{timestamp}-{uuid}` (e.g. `RX-1739456789-A1B2C3D4`)
- **Digital Signature**: SHA-256 hash generated when doctor signs prescription
- **Signed Timestamp**: Recorded at signing time

### PDF Generation
- Prescription PDF generated automatically when doctor creates prescription
- **PDF contains**: Hospital name, Prescription ID, QR code, Patient details, Doctor details, Diagnosis, Medicines (dosage/duration), Digital signature, Date
- **Storage**: Saved in `backend/uploads/prescriptions/`

### Patient - Download Prescription PDF
- **Endpoint**: `GET /api/patient/prescriptions/:id/download`
- Patients can download their prescription as PDF (only their own prescriptions)

---

## 2. Pharmacy Status Tracking

### Extended Status Flow
Prescription status now supports:
- `pending` – Received, not yet checked
- `ready` – Medicines available, ready for pickup
- `out_of_stock` – One or more medicines not in stock
- `dispensed` – Medicine given to patient

### New Pharmacy Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/pharmacy/prescription/:id/status` | Update status to `ready` or `out_of_stock` (body: `{ status }`) |
| GET | `/api/pharmacy/inventory` | Get medicine inventory |
| POST | `/api/pharmacy/inventory` | Add new medicine |
| PUT | `/api/pharmacy/inventory/:id` | Update medicine stock/quantity |
| GET | `/api/pharmacy/sales-report` | Get dispensing/sales report (optional: `?startDate=&endDate=`) |

### Patient Tracking
Patients can track pharmacy status via `GET /api/patient/prescriptions` – each prescription now includes `status` (pending/ready/out_of_stock/dispensed).

---

## 3. Medicine Inventory

### Medicine Model
- Fields: `name`, `genericName`, `category`, `quantity`, `minQuantity`, `unit`, `status`, `pricePerUnit`
- Auto status: `in_stock` / `low_stock` / `out_of_stock` based on quantity

---

## 4. Patient Feedback

### Submit Feedback (1–5 Rating)
- **Endpoint**: `POST /api/feedback`
- **Body**: `{ appointmentId, rating (1-5), comment?, category? }`
- Only for **completed** appointments; one feedback per appointment

### Feedback Analytics
- **Doctor feedback**: `GET /api/feedback/doctor/:doctorId` (doctor/admin)
- **All feedback**: `GET /api/feedback` (admin)

---

## 5. Department Management (Admin)

### Department Model
- Fields: `name`, `code`, `description`, `headId` (Doctor), `floor`, `contactExt`, `isActive`

### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List all active departments |
| POST | `/api/departments` | Create department (admin) |
| PUT | `/api/departments/:id` | Update department (admin) |
| PUT | `/api/departments/:id/head` | Assign department head (admin, body: `{ doctorId }`) |

---

## 6. Notifications

### Notification Model
- Types: `appointment`, `prescription`, `lab_report`, `approval`, `reminder`, `system`
- Fields: `userId`, `type`, `title`, `message`, `data`, `isRead`, `readAt`

### Lab Report Notification
- When lab uploads report, **patient** and **doctor** get a notification automatically

### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications (optional: `?unreadOnly=true`) |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |

---

## 7. Audit Logs (Admin)

### AuditLog Model
- Logs: `userId`, `role`, `action`, `resource`, `resourceId`, `details`, `ipAddress`, `userAgent`, `timestamp`

### Endpoint
- **GET** `/api/admin/audit-logs` – List audit logs (optional: `?limit=&action=&resource=`)

---

## 8. AI Module

### AI-Suggested Slots
- **Endpoint**: `GET /api/availability/ai-slots?doctorId=&date=`
- Returns available slots **prioritized by less crowded times** (based on historical data)

### Analytics
- **Admin AI Analytics**: `GET /api/admin/ai-analytics?daysBack=30`
  - Daily appointment counts, hourly distribution, status breakdown
- **Doctor Workload**: `GET /api/doctor/workload?daysBack=7`
  - Per-day appointment counts and completed count

---

## New Dependencies Added
```
pdfkit
qrcode
uuid
```

---

## Summary of New API Routes

| Route | Methods | Role |
|-------|---------|------|
| `/api/patient/prescriptions/:id/download` | GET | Patient |
| `/api/pharmacy/prescription/:id/status` | PUT | Pharmacy |
| `/api/pharmacy/inventory` | GET, POST | Pharmacy |
| `/api/pharmacy/inventory/:id` | PUT | Pharmacy |
| `/api/pharmacy/sales-report` | GET | Pharmacy |
| `/api/feedback` | GET, POST | Patient (POST), Admin (GET) |
| `/api/feedback/doctor/:doctorId` | GET | Doctor, Admin |
| `/api/departments` | GET, POST | All (GET), Admin (POST) |
| `/api/departments/:id` | PUT | Admin |
| `/api/departments/:id/head` | PUT | Admin |
| `/api/notifications` | GET | All |
| `/api/notifications/:id/read` | PUT | All |
| `/api/notifications/read-all` | PUT | All |
| `/api/availability/ai-slots` | GET | All |
| `/api/admin/audit-logs` | GET | Admin |
| `/api/admin/ai-analytics` | GET | Admin |
| `/api/doctor/workload` | GET | Doctor |

---

## Next Steps (Frontend Integration)

To complete the workflow, the frontend should:
1. **Patient**: Add "Download PDF" button on prescriptions list
2. **Patient**: Show pharmacy status (Pending / Ready / Out of stock / Dispensed) for each prescription
3. **Patient**: Add feedback form after viewing completed appointment
4. **Pharmacy**: Add status buttons (Ready / Out of stock) before Dispense
5. **Pharmacy**: Add Inventory and Sales Report screens
6. **Admin**: Add Department management UI
7. **Admin**: Add Audit Logs and AI Analytics dashboard
8. **All**: Add Notifications bell/panel
9. **Patient/Staff**: Use AI-suggested slots in booking flow
