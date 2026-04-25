# Patient Module Authentication Features - Setup Guide

## ✅ What's Been Implemented

### 1. **Password Reset Flow**
- User requests password reset → receives email with token
- Token is valid for 1 hour
- User clicks link → enters new password → password is reset

**API Endpoints:**
- `POST /api/auth/forgot-password` - Send reset email
- `POST /api/auth/reset-password/:token` - Reset password with token

### 2. **Email Verification**
- New patients receive verification email upon registration
- Token is valid for 24 hours
- User clicks link → email is verified

**API Endpoint:**
- `GET /api/auth/verify-email/:token` - Verify email

### 3. **Enhanced Patient Profile**
New fields added to Patient model:
- `profilePhoto` - Upload profile picture
- `allergies` - Track allergies with severity and reactions
- `chronicDiseases` - Track chronic conditions with status
- `vaccinations` - Vaccination history
- `insuranceDetails` - Insurance policy information
- `emergencyContacts` - Multiple emergency contacts
- `familyMembers` - Link family member accounts

## 🔧 Setup Instructions

### Step 1: Configure Email Service

Add these variables to your `.env` file:

```env
# For Gmail (Easiest for Development)
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your-app-specific-password
FRONTEND_URL=http://localhost:3000

# NODE_ENV (optional - for development mode)
NODE_ENV=development
```

### Step 2: Get Gmail App Password

1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App passwords
4. Generate password for "Mail" app
5. Copy the 16-character password
6. Use it as `EMAIL_PASS` in .env

### Step 3: Restart Backend Server

```bash
cd backend
npm start
```

## 🧪 Testing the Features

### Test Password Reset
```bash
# 1. Request password reset
curl -X POST http://localhost:5000/api/auth/forgot-password \\
  -H "Content-Type: application/json" \\
  -d '{"email":"patient@example.com"}'

# 2. Check email for reset link
# 3. Use the token to reset password
curl -X POST http://localhost:5000/api/auth/reset-password/TOKEN_HERE \\
  -H "Content-Type: application/json" \\
  -d '{"password":"newpassword123"}'
```

### Test Email Verification
```bash
# 1. Register new patient (will send verification email)
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"newpatient@test.com", "password":"pass123", "role":"patient", "fullName":"Test Patient", ...}'

# 2. Check email for verification link
# 3. Click link or use token
curl -X GET http://localhost:5000/api/auth/verify-email/TOKEN_HERE
```

### Test Enhanced Profile Update
```bash
# Update profile with new fields
curl -X PUT http://localhost:5000/api/patient/profile \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "allergies": [
      {
        "allergen": "Penicillin",
        "severity": "severe",
        "reaction": "Anaphylaxis"
      }
    ],
    "chronicDiseases": [
      {
        "disease": "Diabetes Type 2",
        "diagnosedDate": "2020-05-10",
        "severity": "moderate",
        "currentStatus": "controlled"
      }
    ],
    "insuranceDetails": {
      "provider": "HealthCare Plus",
      "policyNumber": "POL123456",
      "coverageAmount": 500000
    }
  }'
```

## 📝 Email Templates

The emails sent include:

1. **Verification Email**
   - Welcome message
   - Verification button/link
   - 24-hour expiry notice

2. **Password Reset Email**
   - Reset password button/link
   - 1-hour expiry notice
   - Security notice

3. **Appointment Reminder** (ready to use)
   - Doctor name, date, time
   - Reminder to arrive 10 mins early

## 🎯 Next Steps

To complete Patient Module Phase 1, you still need:

1. **Frontend Components** (React):
   - Forgot Password form
   - Reset Password form
   - Email verification success page
   - Enhanced profile edit form

2. **Activity Logging**:
   - Log all patient actions for security audit

3. **Two-Factor Authentication** (optional advanced feature)

## 🔒 Security Notes

- Email verification tokens are hashed before storage
- Reset tokens expire after 1 hour
- Verification tokens expire after 24 hours
- Tokens cannot be reused after successful verification/reset
- Passwords are hashed using bcrypt before storage

## 📦 Dependencies Installed

- `nodemailer` - For sending emails

## ⚠️ Important Notes

- **Development Mode**: Emails will work with Gmail SMTP
- **Production Mode**: Use SendGrid, AWS SES, or other professional SMTP service
- **Email Deliverability**: Gmail may mark emails as spam initially - check spam folder
- **Rate Limits**: Gmail has daily sending limits (~500/day)
