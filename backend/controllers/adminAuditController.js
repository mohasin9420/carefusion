const AuditLog = require('../models/AuditLog');
const HospitalConfig = require('../models/HospitalConfig');

// @desc    Get audit logs with filters
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res) => {
    try {
        const { category, action, severity, userId, days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const query = { createdAt: { $gte: startDate } };
        if (category) query.category = category;
        if (action) query.action = action;
        if (severity) query.severity = severity;
        if (userId) query.userId = userId;

        const logs = await AuditLog.find(query)
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 })
            .limit(100); // Limit to 100 recent logs

        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get security alerts
// @route   GET /api/admin/audit-logs/security-alerts
// @access  Private/Admin
exports.getSecurityAlerts = async (req, res) => {
    try {
        const { days = 7 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const alerts = await AuditLog.find({
            isSecurityAlert: true,
            createdAt: { $gte: startDate }
        })
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 });

        // Count by severity
        const severityCount = alerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {});

        res.json({
            period: `Last ${days} days`,
            totalAlerts: alerts.length,
            severityBreakdown: severityCount,
            alerts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get login tracking
// @route   GET /api/admin/audit-logs/login-tracking
// @access  Private/Admin
exports.getLoginTracking = async (req, res) => {
    try {
        const { days = 7 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const loginLogs = await AuditLog.find({
            action: { $in: ['login', 'logout', 'failed_login'] },
            createdAt: { $gte: startDate }
        })
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 });

        // Stats
        const totalLogins = loginLogs.filter(log => log.action === 'login').length;
        const failedLogins = loginLogs.filter(log => log.action === 'failed_login').length;
        const totalLogouts = loginLogs.filter(log => log.action === 'logout').length;

        res.json({
            period: `Last ${days} days`,
            stats: {
                totalLogins,
                failedLogins,
                totalLogouts,
                failureRate: totalLogins > 0 ? ((failedLogins / (totalLogins + failedLogins)) * 100).toFixed(2) : 0
            },
            logs: loginLogs
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get hospital configuration
// @route   GET /api/admin/config
// @access  Private/Admin
exports.getHospitalConfig = async (req, res) => {
    try {
        let config = await HospitalConfig.findOne();

        if (!config) {
            // Create default config if none exists
            config = await HospitalConfig.create({
                hospitalName: 'Hospital Management System',
                contactNumbers: {
                    main: '',
                    emergency: '',
                    ambulance: '',
                    helpdesk: ''
                }
            });
        }

        res.json(config);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update hospital configuration
// @route   PUT /api/admin/config
// @access  Private/Admin
exports.updateHospitalConfig = async (req, res) => {
    try {
        let config = await HospitalConfig.findOne();

        if (!config) {
            config = await HospitalConfig.create(req.body);
        } else {
            Object.assign(config, req.body);
            await config.save();
        }

        // Log the action
        await AuditLog.create({
            userId: req.user._id,
            action: 'config_changed',
            category: 'configuration',
            severity: 'high',
            description: 'Updated hospital configuration'
        });

        res.json({
            message: 'Configuration updated successfully',
            config
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// All functions already exported via exports.functionName above

