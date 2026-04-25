# Doctor Module - Phase 1: Queue & Emergency Slots - Setup Guide

## ✅ What's Been Implemented

### 1. **Enhanced Queue Model**
Added fields to track:
- `appointmentType`: scheduled/walk-in/emergency
- `priority`: normal/high/urgent  
- `consultationStatus`: waiting/in-progress/completed/no-show/cancelled
- `estimatedWaitTime`: in minutes
- `actualStartTime` & `actualEndTime`: for tracking
- `appointmentId`: link to appointment

### 2. **Queue Management API**

**GET /api/doctor/queue?status=waiting**
- View today's patient queue
- Filter by status (waiting/in-progress/completed)
- Sorted by priority (urgent first) then token number
- Returns patient details with wait times

**PUT /api/doctor/queue/:id/call**
- Call next patient
- Marks queue item as "in-progress"
- Records actual start time
- Updates linked appointment status

**PUT /api/doctor/appointment/:id/status**
- Update appointment status
- Options: completed, in-progress, cancelled, no-show
- Automatically updates queue item
- Records end time

**POST /api/doctor/emergency-slot**
- Create emergency appointment
- Adds to queue with "urgent" priority
- Estimated wait time: 5 minutes
- Automatically creates appointment record

## 🧪 Testing the Features

### 1. View Patient Queue
```bash
curl -X GET http://localhost:5000/api/doctor/queue \\
  -H "Authorization: Bearer DOCTOR_JWT_TOKEN"

# Filter by status
curl -X GET "http://localhost:5000/api/doctor/queue?status=waiting" \\
  -H "Authorization: Bearer DOCTOR_JWT_TOKEN"
```

### 2. Call Next Patient
```bash
curl -X PUT http://localhost:5000/api/doctor/queue/QUEUE_ID/call \\
  -H "Authorization: Bearer DOCTOR_JWT_TOKEN"
```

### 3. Mark Appointment Complete
```bash
curl -X PUT http://localhost:5000/api/doctor/appointment/APPOINTMENT_ID/status \\
  -H "Authorization: Bearer DOCTOR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "completed", "notes": "Patient treated successfully"}'
```

### 4. Create Emergency Slot
```bash
curl -X POST http://localhost:5000/api/doctor/emergency-slot \\
  -H "Authorization: Bearer DOCTOR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "patientId": "PATIENT_OBJECT_ID",
    "timeSlot": "14:00-14:30",
    "notes": "Chest pain emergency"
  }'
```

## 📊 Queue System Features

### Priority System
1. **Urgent** (Red) - Emergency cases, bypasses queue
2. **High** (Yellow) - Scheduled appointments running late
3. **Normal** (Green) - Regular walk-ins and scheduled

### Status Flow
```
waiting → in-progress → completed
                    → no-show
                    → cancelled
```

### Auto-Increment Token Numbers
- Token numbers reset daily
- Auto-assigned when queue item created
- Format: 1, 2, 3, ... per day

## 🎯 Next Steps - Doctor Module

**Phase 2: Enhanced EMR with Alerts** (Next to implement)
- Allergy alert system
- Drug interaction warnings
- Chronic condition flags

**Remaining in Phase 1:**
- Walk-in patient token system (frontend component needed)

## 📝 Notes

- Queue items are automatically cleaned up for past dates
- Emergency appointments appear at top of queue
- Doctors can only see their own queue
- Queue integrates with existing Appointment model
