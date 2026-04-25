# 🔐 DEFAULT ADMIN CREDENTIALS

## Permanent Admin Account

CareFusion Hospital Management System comes with a **pre-configured default admin account** that is automatically created when the server starts.

### Login Credentials

```
Email:    admin@carefusion.com
Password: Admin@123
Role:     Admin
```

---

## Important Notes

### ✅ Automatic Creation
- The default admin account is **automatically created** when you start the backend server
- If the account already exists, it won't be created again
- No manual setup required

### 🔒 Security Recommendations

1. **Change Password After First Login** (Recommended)
   - While this is a permanent default account, consider changing the password for security

2. **Create Additional Admin Accounts**
   - Use this account to create other admin users
   - Don't share the default admin credentials with everyone

3. **Use for Emergency Access**
   - Keep this account as a backup for system administration
   - If other admin accounts get locked, you can always use this one

### 🚀 How to Use

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```
   
2. **Look for the confirmation message in the console:**
   ```
   ✅ Default admin account created successfully!
   📧 Email: admin@carefusion.com
   🔑 Password: Admin@123
   ```

3. **Login at:** http://localhost:5173/login
   - Select role: **Admin**
   - Enter the credentials above
   - Click **Login**

4. **You'll be redirected to:** `/admin` (Admin Dashboard)

---

## What This Admin Can Do

### Full System Access:
- ✅ Approve/Reject user registrations
- ✅ Create new users (patients, doctors, staff, pharmacy, laboratory)
- ✅ View all system users
- ✅ Block/Unblock users
- ✅ Delete users
- ✅ View system analytics
- ✅ Access all dashboards
- ✅ Manage system configurations

---

## Creating Additional Admins

Once logged in with the default admin account, you can create additional admin users:

1. Go to **Admin Dashboard** → **User Management**
2. Click **Create New User**
3. Select role: **Admin**
4. Fill in details and submit
5. The new admin will need approval (auto-approved if created by admin)

---

## Troubleshooting

### Account Not Created?
If the default admin account is not created automatically:

1. **Run the seed script manually:**
   ```bash
   cd backend
   node seedAdmin.js
   ```

2. **Check MongoDB connection:**
   - Ensure MongoDB is running
   - Check your `.env` file for correct `MONGODB_URI`

### Can't Login?
- Make sure you selected **Admin** role in the login dropdown
- Email is `admin@carefusion.com` (not admin@hospital.com)
- Password is case-sensitive: `Admin@123`

---

## Technical Details

### Database Model
The default admin account is created with:
- **Email:** admin@carefusion.com
- **Password:** Admin@123 (hashed with bcrypt)
- **Role:** admin
- **Status:** approved (auto-approved)
- **isDefaultAdmin:** true (flag for identification)

### Source Files
- Auto-creation: `backend/utils/createDefaultAdmin.js`
- Manual seed: `backend/seedAdmin.js`
- Server initialization: `backend/server.js`

---

**Last Updated:** February 12, 2026
**System:** CareFusion Hospital Management System v1.0
