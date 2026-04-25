const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['appointment', 'prescription', 'lab_report', 'approval', 'reminder', 'system', 'lab_request', 'reschedule'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: String,
    data: {
        appointmentId: mongoose.Schema.Types.ObjectId,
        prescriptionId: mongoose.Schema.Types.ObjectId,
        labTestId: mongoose.Schema.Types.ObjectId,
        url: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
