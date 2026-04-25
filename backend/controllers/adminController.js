const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Staff = require('../models/Staff');
const Pharmacy = require('../models/Pharmacy');
const Laboratory = require('../models/Laboratory');
const Appointment = require('../models/Appointment');
const AuditLog = require('../models/AuditLog');
const DoctorAvailability = require('../models/DoctorAvailability');
const HospitalConfig = require('../models/HospitalConfig');
const aiService = require('../services/aiService');

// @desc    Get all users pending approval (excluding patients who are auto-approved)
// @route   GET /api/admin/pending-users
// @access  Private/Admin
exports.getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({
            status: 'pending',
            role: { $ne: 'patient' } // Exclude patients - they're auto-approved
        }).select('-password');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Approve or reject user
// @route   PUT /api/admin/approve-user/:id
// @access  Private/Admin
exports.approveUser = async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = status;
        await user.save();

        res.json({ message: `User ${status}`, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create new user (Admin creates accounts)
// @route   POST /api/admin/create-user
// @access  Private/Admin
exports.createUser = async (req, res) => {
    let createdUser = null;

    try {
        const { email, password, role, profileData } = req.body;

        // Validate required fields
        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Email, password, and role are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Create base user
        createdUser = await User.create({
            email,
            password,
            role,
            status: 'approved',
            createdBy: req.user._id
        });

        // Create role-specific profile (skip for admin role)
        let profile = null;
        if (role !== 'admin' && profileData) {
            switch (role) {
                case 'patient':
                    profile = await Patient.create({ ...profileData, userId: createdUser._id });
                    break;
                case 'doctor':
                    profile = await Doctor.create({ 
                        ...profileData, 
                        userId: createdUser._id,
                        consultationFee: profileData.consultationFee || 500,
                        upiId: profileData.upiId || ''
                    });

                    // Create default 5-day availability (Monday-Friday, 9AM-5PM)
                    const defaultAvailability = [];
                    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) { // 1=Monday through 5=Friday
                        defaultAvailability.push({
                            doctorId: profile._id,
                            dayOfWeek: dayOfWeek,
                            startTime: '09:00',
                            endTime: '17:00',
                            slotDuration: 15, // 15-minute slots
                            maxPatientsPerSlot: 1,
                            isActive: true
                        });
                    }

                    // Insert all default availability records
                    if (defaultAvailability.length > 0) {
                        await DoctorAvailability.insertMany(defaultAvailability);
                        console.log(`✅ [Admin] Created default 5-day availability for doctor: ${profileData.fullName}`);
                    }
                    break;
                case 'staff':
                    profile = await Staff.create({ ...profileData, userId: createdUser._id });
                    break;
                case 'pharmacy':
                    profile = await Pharmacy.create({ ...profileData, userId: createdUser._id });
                    break;
                case 'laboratory':
                    profile = await Laboratory.create({ ...profileData, userId: createdUser._id });
                    break;
            }
        }

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: createdUser._id,
                email: createdUser.email,
                role: createdUser.role,
                profile
            }
        });
    } catch (error) {
        console.error(error);

        // Rollback: Delete user if profile creation failed
        if (createdUser) {
            await User.findByIdAndDelete(createdUser._id);
        }

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                message: 'Validation error: ' + messages.join(', ')
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                message: `${field} already exists`
            });
        }

        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments();
        const totalDoctors = await Doctor.countDocuments();
        const totalStaff = await Staff.countDocuments();
        const totalAppointments = await Appointment.countDocuments();
        const todayAppointments = await Appointment.countDocuments({
            appointmentDate: {
                $gte: new Date().setHours(0, 0, 0, 0),
                $lt: new Date().setHours(23, 59, 59, 999)
            }
        });

        res.json({
            totalPatients,
            totalDoctors,
            totalStaff,
            totalAppointments,
            todayAppointments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all users by role
// @route   GET /api/admin/users/:role
// @access  Private/Admin
exports.getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;
        const users = await User.find({ role }).select('-password');

        // Get profiles for each user
        const usersWithProfiles = await Promise.all(users.map(async (user) => {
            let profile = null;
            switch (role) {
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
            return { ...user.toObject(), profile };
        }));

        res.json(usersWithProfiles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user counts by role with status breakdown
// @route   GET /api/admin/user-counts
// @access  Private/Admin
exports.getUserCounts = async (req, res) => {
    try {
        const roles = ['patient', 'doctor', 'staff', 'pharmacy', 'laboratory'];
        const counts = {};

        for (const role of roles) {
            const total = await User.countDocuments({ role });
            const pending = await User.countDocuments({ role, status: 'pending' });
            const approved = await User.countDocuments({ role, status: 'approved' });

            counts[role] = {
                total,
                pending,
                approved
            };
        }

        res.json(counts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user details with profile
// @route   GET /api/admin/user/:id
// @access  Private/Admin
exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
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

        res.json({ user: user.toObject(), profile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Block/Unblock user
// @route   PUT /api/admin/block-user/:id
// @access  Private/Admin
exports.blockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Toggle between blocked and approved
        const newStatus = user.status === 'blocked' ? 'approved' : 'blocked';
        user.status = newStatus;
        await user.save();

        res.json({
            message: `User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`,
            user: user.toObject()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res) => {
    try {
        const { limit = 100, action, resource } = req.query;
        const query = {};
        if (action) query.action = action;
        if (resource) query.resource = resource;

        const logs = await AuditLog.find(query)
            .populate('userId', 'email role')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get AI analytics dashboard
// @route   GET /api/admin/ai-analytics
// @access  Private/Admin
exports.getAIAnalytics = async (req, res) => {
    try {
        const { daysBack = 30 } = req.query;
        const analytics = await aiService.getAppointmentAnalytics(parseInt(daysBack));
        res.json(analytics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete user and their profile
// @route   DELETE /api/admin/delete-user/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting admin accounts
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete admin accounts' });
        }

        // Delete role-specific profile
        switch (user.role) {
            case 'patient':
                await Patient.deleteOne({ userId: user._id });
                break;
            case 'doctor':
                await Doctor.deleteOne({ userId: user._id });
                break;
            case 'staff':
                await Staff.deleteOne({ userId: user._id });
                break;
            case 'pharmacy':
                await Pharmacy.deleteOne({ userId: user._id });
                break;
            case 'laboratory':
                await Laboratory.deleteOne({ userId: user._id });
                break;
        }

        // Delete user account
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update doctor's consultation fee and UPI ID
// @route   PUT /api/admin/update-doctor-fee/:id
// @access  Private/Admin or Private/Staff
exports.updateDoctorFee = async (req, res) => {
    try {
        const { id } = req.params; // doctorId (profile ID)
        const { consultationFee, upiId } = req.body;

        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee);
        if (upiId !== undefined) doctor.upiId = upiId;

        await doctor.save();

        res.json({
            message: 'Doctor fee and UPI updated successfully',
            doctor
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update global payment settings
// @route   PUT /api/admin/config/payment
// @access  Private/Admin
exports.updatePaymentConfig = async (req, res) => {
    try {
        const { defaultUpiId } = req.body;
        let config = await HospitalConfig.findOne();
        
        if (!config) {
            return res.status(404).json({ message: 'Hospital configuration not found' });
        }

        if (!config.paymentSettings) config.paymentSettings = {};
        config.paymentSettings.defaultUpiId = defaultUpiId;
        
        await config.save();
        res.json({ message: 'Payment configuration updated', config });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
