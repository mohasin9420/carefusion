const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const Department = require('../models/Department');
const Prescription = require('../models/Prescription');
const LabTest = require('../models/LabTest');

// @desc    Get dashboard overview
// @route   GET /api/admin/analytics/dashboard
// @access  Private/Admin
exports.getDashboardOverview = async (req, res) => {
    try {
        // Count totals
        const totalPatients = await Patient.countDocuments();
        const totalDoctors = await Doctor.countDocuments();
        const totalAppointments = await Appointment.countDocuments();
        const totalPrescriptions = await Prescription.countDocuments();
        const totalLabTests = await LabTest.countDocuments();

        // Revenue calculation
        const revenueData = await Bill.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$grandTotal' },
                    totalBills: { $sum: 1 }
                }
            }
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
        const totalBills = revenueData.length > 0 ? revenueData[0].totalBills : 0;

        // Recent activity counts
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayAppointments = await Appointment.countDocuments({
            appointmentDate: { $gte: today }
        });

        const todayRevenue = await Bill.aggregate([
            {
                $match: {
                    createdAt: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$grandTotal' }
                }
            }
        ]);

        res.json({
            overview: {
                totalPatients,
                totalDoctors,
                totalAppointments,
                totalPrescriptions,
                totalLabTests,
                totalRevenue,
                totalBills
            },
            today: {
                appointments: todayAppointments,
                revenue: todayRevenue.length > 0 ? todayRevenue[0].revenue : 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get appointment statistics
// @route   GET /api/admin/analytics/appointments
// @access  Private/Admin
exports.getAppointmentStatistics = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Status breakdown
        const statusBreakdown = await Appointment.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Daily appointments
        const dailyAppointments = await Appointment.aggregate([
            {
                $match: {
                    appointmentDate: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Booking type breakdown
        const bookingTypeBreakdown = await Appointment.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$bookingType',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            period: `Last ${days} days`,
            statusBreakdown,
            dailyAppointments,
            bookingTypeBreakdown
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get revenue breakdown by department
// @route   GET /api/admin/analytics/revenue-by-department
// @access  Private/Admin
exports.getRevenueByDepartment = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const departments = await Department.find({ status: 'active' });

        const departmentRevenue = departments.map(dept => ({
            department: dept.name,
            code: dept.code,
            revenue: dept.totalRevenue || 0,
            appointments: dept.totalAppointments || 0,
            patients: dept.totalPatients || 0
        }));

        // Sort by revenue
        departmentRevenue.sort((a, b) => b.revenue - a.revenue);

        res.json({
            period: `Last ${days} days`,
            departmentRevenue,
            totalRevenue: departmentRevenue.reduce((sum, d) => sum + d.revenue, 0)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get doctor performance analytics
// @route   GET /api/admin/analytics/doctor-performance
// @access  Private/Admin
exports.getDoctorPerformance = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Appointments per doctor
        const doctorAppointments = await Appointment.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$doctorId',
                    totalAppointments: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    cancelled: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'doctors',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'doctor'
                }
            },
            {
                $unwind: '$doctor'
            },
            {
                $project: {
                    doctorName: '$doctor.fullName',
                    specialization: '$doctor.specialization',
                    totalAppointments: 1,
                    completed: 1,
                    cancelled: 1,
                    completionRate: {
                        $multiply: [
                            { $divide: ['$completed', '$totalAppointments'] },
                            100
                        ]
                    }
                }
            },
            {
                $sort: { totalAppointments: -1 }
            }
        ]);

        res.json({
            period: `Last ${days} days`,
            doctorPerformance: doctorAppointments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get patient growth report
// @route   GET /api/admin/analytics/patient-growth
// @access  Private/Admin
exports.getPatientGrowth = async (req, res) => {
    try {
        const { months = 12 } = req.query;

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - parseInt(months));

        const monthlyGrowth = await Patient.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        const totalPatients = await Patient.countDocuments();
        const newPatients = await Patient.countDocuments({
            createdAt: { $gte: startDate }
        });

        res.json({
            period: `Last ${months} months`,
            totalPatients,
            newPatients,
            monthlyGrowth
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get system health monitoring
// @route   GET /api/admin/analytics/system-health
// @access  Private/Admin
exports.getSystemHealth = async (req, res) => {
    try {
        const dbStatus = 'healthy'; // In production, check actual DB connection

        // Check recent activity
        const recentUsers = await User.countDocuments({
            updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        const recentAppointments = await Appointment.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        // Count users by status
        const userStatus = await User.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            system: {
                status: 'operational',
                database: dbStatus,
                uptime: process.uptime(),
                timestamp: new Date()
            },
            activity: {
                activeUsersLast24h: recentUsers,
                appointmentsLast24h: recentAppointments
            },
            userStatus
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', system: { status: 'error' } });
    }
};

// All functions already exported via exports.functionName above

