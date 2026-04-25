const mongoose = require('mongoose');

const doctorAvailabilitySchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    dayOfWeek: {
        type: Number, // 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
        required: true,
        min: 0,
        max: 6
    },
    startTime: {
        type: String, // Format: "10:00" (24-hour)
        required: true
    },
    endTime: {
        type: String, // Format: "14:00" (24-hour)
        required: true
    },
    slotDuration: {
        type: Number, // Duration in minutes (15, 20, 30, 45, 60)
        required: true,
        default: 15
    },
    maxPatientsPerSlot: {
        type: Number,
        default: 1,
        min: 1
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
doctorAvailabilitySchema.index({ doctorId: 1, dayOfWeek: 1 });

module.exports = mongoose.model('DoctorAvailability', doctorAvailabilitySchema);
