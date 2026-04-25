const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Staff = require('../models/Staff');
const Pharmacy = require('../models/Pharmacy');
const Laboratory = require('../models/Laboratory');
const DoctorAvailability = require('../models/DoctorAvailability');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ message: 'Your account has been blocked. Please contact admin.', code: 'BLOCKED' });
        }

        if (user.status === 'rejected') {
            return res.status(403).json({ message: 'Your registration was rejected. Please contact admin for assistance.', code: 'REJECTED' });
        }

        // Check if user is pending approval (non-patients need admin approval)
        if (user.status !== 'approved') {
            return res.status(403).json({ message: 'Your account is pending admin approval. You will be notified once approved.', code: 'PENDING' });
        }

        // Get role-specific profile
        let profile = null;
        switch (user.role) {
            case 'patient':
                profile = await Patient.findOne({ userId: user._id });
                break;
            case 'doctor':
                profile = await Doctor.findOne({ userId: user._id });
                break;
            case 'staff':
                profile = await Staff.findOne({ userId: user._id });
                break;
            case 'pharmacy':
                profile = await Pharmacy.findOne({ userId: user._id });
                break;
            case 'laboratory':
                profile = await Laboratory.findOne({ userId: user._id });
                break;
        }

        res.json({
            token: generateToken(user._id),
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                profile
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        let profile = null;
        switch (req.user.role) {
            case 'patient':
                profile = await Patient.findOne({ userId: req.user._id });
                break;
            case 'doctor':
                profile = await Doctor.findOne({ userId: req.user._id });
                break;
            case 'staff':
                profile = await Staff.findOne({ userId: req.user._id });
                break;
            case 'pharmacy':
                profile = await Pharmacy.findOne({ userId: req.user._id });
                break;
            case 'laboratory':
                profile = await Laboratory.findOne({ userId: req.user._id });
                break;
        }

        res.json({
            user: {
                id: req.user._id,
                email: req.user.email,
                role: req.user.role,
                profile
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    let createdUser = null;

    try {
        const { email, password, role } = req.body;

        // profileData arrives as JSON string in multipart/form-data, or as object in JSON body
        let profileData = req.body.profileData;
        if (typeof profileData === 'string') {
            try { profileData = JSON.parse(profileData); } catch { profileData = {}; }
        }

        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Email, password, and role are required' });
        }

        if (role === 'admin') {
            return res.status(403).json({ message: 'Admin accounts can only be created by existing admins' });
        }

        const validationError = validateProfileData(role, profileData);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: `Email "${email}" is already registered. Please use a different email or login.` });
        }

        // Extract profile image path if an image was uploaded
        const profilePicturePath = req.file
            ? `/uploads/profiles/${req.file.filename}`
            : null;

        // Create user — patients auto-approved, others pending admin
        createdUser = await User.create({
            email,
            password,
            role,
            status: role === 'patient' ? 'approved' : 'pending'
        });

        // Create role-specific profile
        let profile = null;
        const profileDataWithUser = { ...profileData, userId: createdUser._id };

        switch (role) {
            case 'patient':
                profile = await Patient.create({
                    ...profileDataWithUser,
                    profilePhoto: profilePicturePath
                });
                break;
            case 'doctor':
                profile = await Doctor.create({
                    ...profileDataWithUser,
                    profilePicture: profilePicturePath
                });
                // Create default 5-day availability (Monday–Friday, 9AM–5PM)
                const defaultAvailability = [];
                for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
                    defaultAvailability.push({
                        doctorId: profile._id,
                        dayOfWeek,
                        startTime: '09:00',
                        endTime: '17:00',
                        slotDuration: 15,
                        maxPatientsPerSlot: 1,
                        isActive: true
                    });
                }
                if (defaultAvailability.length > 0) {
                    await DoctorAvailability.insertMany(defaultAvailability);
                    console.log(`✅ Created default availability for doctor: ${profileData.fullName}`);
                }
                break;
            case 'staff':
                profile = await Staff.create(profileDataWithUser);
                break;
            case 'pharmacy':
                profile = await Pharmacy.create(profileDataWithUser);
                break;
            case 'laboratory':
                profile = await Laboratory.create(profileDataWithUser);
                break;
        }

        const message = role === 'patient'
            ? 'Registration successful! Your account is ready to use.'
            : 'Registration successful! Your account is pending admin approval.';

        res.status(201).json({
            message,
            user: {
                id: createdUser._id,
                email: createdUser.email,
                role: createdUser.role,
                status: createdUser.status
            }
        });
    } catch (error) {
        console.error('Registration error:', error);

        if (createdUser) {
            await User.findByIdAndDelete(createdUser._id);
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ message: 'Validation error: ' + messages.join(', ') });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }

        res.status(500).json({
            message: 'Registration failed. Please try again.',
            error: error.message
        });
    }
};

// Helper function to validate profile data
function validateProfileData(role, profileData) {
    if (!profileData) return 'Profile data is required';

    switch (role) {
        case 'patient':
            if (!profileData.fullName) return 'Full name is required';
            break;
        case 'doctor':
            if (!profileData.fullName) return 'Full name is required';
            break;
        case 'staff':
            if (!profileData.name) return 'Name is required';
            break;
        case 'pharmacy':
            if (!profileData.pharmacistName) return 'Pharmacist name is required';
            break;
        case 'laboratory':
            if (!profileData.name) return 'Name is required';
            break;
    }

    return null;
}

// @desc    Forgot password — Email disabled, returns generic message
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    // Email functionality has been disabled.
    // Contact the system administrator to reset your password.
    return res.status(503).json({
        message: 'Password reset via email is currently disabled. Please contact the system administrator.'
    });
};

// @desc    Reset password with token — disabled
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    return res.status(503).json({
        message: 'Password reset via email is currently disabled. Please contact the system administrator.'
    });
};

// @desc    Verify email OTP — disabled (no longer required)
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyEmailOtp = async (req, res) => {
    return res.status(410).json({
        message: 'Email OTP verification has been removed. Accounts are verified automatically on registration.'
    });
};

// @desc    Resend OTP — disabled
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res) => {
    return res.status(410).json({
        message: 'Email OTP system has been removed. No verification is required.'
    });
};
