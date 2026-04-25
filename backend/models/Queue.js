const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    tokenNumber: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['waiting', 'in-progress', 'completed'],
        default: 'waiting'
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true // Making it required for better tracking
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    appointmentType: {
        type: String,
        enum: ['scheduled', 'walk-in', 'emergency'],
        default: 'walk-in'
    },
    priority: {
        type: String,
        enum: ['normal', 'high', 'urgent'],
        default: 'normal'
    },
    estimatedWaitTime: {
        type: Number, // in minutes
        default: 15
    },
    actualStartTime: Date,
    actualEndTime: Date,
    consultationStatus: {
        type: String,
        enum: ['waiting', 'in-progress', 'completed', 'no-show', 'cancelled'],
        default: 'waiting'
    },
    notes: String
}, {
    timestamps: true
});

// Auto-increment token number for each day
queueSchema.pre('save', async function (next) {
    if (this.isNew) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const count = await mongoose.model('Queue').countDocuments({
            date: { $gte: today, $lt: tomorrow }
        });

        this.tokenNumber = count + 1;
    }
    next();
});

module.exports = mongoose.model('Queue', queueSchema);
