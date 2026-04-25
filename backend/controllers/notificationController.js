const Notification = require('../models/Notification');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        const { unreadOnly } = req.query;
        const query = { userId: req.user._id };
        if (unreadOnly === 'true') query.isRead = false;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true, readAt: new Date() },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true, readAt: new Date() }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper: Create notification for lab report completion (called from laboratory controller)
async function createLabReportNotification(labTest) {
    try {
        let patient = (labTest.patientId && typeof labTest.patientId === 'object') 
            ? labTest.patientId 
            : await Patient.findById(labTest.patientId);
        
        let doctor = (labTest.doctorId && typeof labTest.doctorId === 'object') 
            ? labTest.doctorId 
            : await Doctor.findById(labTest.doctorId);

        if (!patient || !doctor) return;

        // If partially populated without userId, fetch full document
        if (!patient.userId && patient._id) patient = await Patient.findById(patient._id);
        if (!doctor.userId && doctor._id) doctor = await Doctor.findById(doctor._id);

        const patientUserId = patient.userId;
        const doctorUserId = doctor.userId;

    const title = 'Lab Report Ready';
    const message = `Your lab test "${labTest.testName}" report has been uploaded.`;

    if (patientUserId) {
            await Notification.create({
                userId: patientUserId,
                type: 'lab_report',
                title,
                message,
                data: { labTestId: labTest._id }
            });
        }
        if (doctorUserId) {
            await Notification.create({
                userId: doctorUserId,
                type: 'lab_report',
                title: `Lab Report: ${labTest.testName} - ${patient.fullName}`,
                message: 'Lab report has been uploaded for your patient.',
                data: { labTestId: labTest._id }
            });
        }
    } catch (err) {
        console.error('Failed to create lab report notification:', err);
    }
}

// All functions already exported via exports.functionName above
exports.createLabReportNotification = createLabReportNotification;