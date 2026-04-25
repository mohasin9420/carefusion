const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const createDefaultAdmin = require('./utils/createDefaultAdmin');

// Load env
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/laboratory', require('./routes/laboratory'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/lab-tests', require('./routes/labTests'));
app.use('/api/diagnostic-tests', require('./routes/diagnosticTestRoutes'));
app.use('/api/insurance', require('./routes/insurance'));
app.use('/api/public', require('./routes/public'));

// DB connect only
connectDB()
  .then(async () => {
    console.log("✅ MongoDB connected");

    await createDefaultAdmin();
    console.log("✅ Default admin created");
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err);
  });

// Frontend serve
app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});