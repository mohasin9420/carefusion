# Quick Start Guide - CareFusion Hospital Management System

## Prerequisites Check
- ✅ Node.js installed (v14+)
- ✅ MongoDB installed and running
- ✅ Git Bash or PowerShell

## Step-by-Step Setup

### 1. Start MongoDB
```bash
# Make sure MongoDB is running
# Default: mongodb://localhost:27017
```

### 2. Backend Setup (Terminal 1)
```bash
cd d:\Hospital\backend

# Dependencies are already installed
# If not, run: npm install

# Create initial admin user
npm run seed

# Start backend server
npm run dev
```

**Expected output:**
```
✅ Admin user created successfully!
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

### 3. Frontend Setup (Terminal 2)
```bash
cd d:\Hospital\frontend

# Dependencies are already installed
# If not, run: npm install

# Start frontend
npm run dev
```

**Expected output:**
```
VITE v7.x ready
➜ Local: http://localhost:5173/
```

### 4. First Login

1. Open browser: **http://localhost:5173/login**
2. Login with admin credentials:
   - Role: **Admin** (select from dropdown)
   - Email: `admin@carefusion.com`
   - Password: `Admin@123`

### 5. Create Test Users

From Admin Dashboard → Create User:

**Sample Doctor:**
- Email: doctor@hospital.com
- Password: doctor123
- Role: Doctor
- Name: Dr. John Smith
- Specialization: Cardiology
- Department: Medicine
- Qualification: MBBS, MD
- Experience: 10

**Sample Patient:**
- Email: patient@hospital.com
- Password: patient123
- Role: Patient
- Name: Jane Doe
- Age: 30
- Gender: Female
- Mobile: 1234567890
- Address: 123 Main St

**Sample Staff:**
- Email: staff@hospital.com
- Password: staff123
- Role: Staff
- Name: Mike Johnson
- Role Type: Reception
- Department: OPD
- Shift Time: Morning

### 6. Test Different Roles

Logout and login as:
- Doctor → see appointments, create prescriptions
- Patient → see dashboard, view prescriptions
- Staff → manage queue, book appointments

## Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`

**Port Already in Use:**
- Backend: Change PORT in `.env`
- Frontend: Change port in `vite.config.js`

**Admin Seed Error "Already Exists":**
- Admin user already created, skip this step
- Or delete from MongoDB and run again

## URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Sample API Test: http://localhost:5000/api/auth/me

## Default Credentials

**Admin:**
- Email: admin@carefusion.com
- Password: Admin@123

## Next Steps

1. Create users for all roles
2. Test appointment booking flow
3. Test prescription creation
4. Test lab report upload
5. Explore all dashboards

**Enjoy your Hospital Management System! 🏥**
