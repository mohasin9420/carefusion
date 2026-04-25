const mongoose = require('mongoose');

const blockedSlotSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    blockedDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String // Optional: block specific time slots (e.g., "10:00")
    },
    endTime: {
        type: String // Optional: block specific time slots (e.g., "12:00")
    },
    reason: {
        type: String,
        enum: ['leave', 'emergency', 'conference', 'surgery', 'other'],
        default: 'other'
    },
    isFullDay: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient date-based queries
blockedSlotSchema.index({ doctorId: 1, blockedDate: 1 });

module.exports = mongoose.model('BlockedSlot', blockedSlotSchema);
