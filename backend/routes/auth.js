const express = require('express');
const router = express.Router();
const { login, getMe, register, forgotPassword, resetPassword, verifyEmailOtp, resendOtp } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const profileUpload = require('../middleware/profileUpload');

router.post('/login', login);

// Register with optional profile image upload (multipart/form-data)
router.post('/register', profileUpload.single('profilePicture'), register);

router.get('/me', protect, getMe);

// Password Reset (disabled — returns 503)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Email OTP (disabled — returns 410)
router.post('/verify-otp', verifyEmailOtp);
router.post('/resend-otp', resendOtp);

module.exports = router;
