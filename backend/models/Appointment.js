const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String // Keep for backward compatibility
    },
    slotStartTime: {
        type: String, // Format: "10:00" (24-hour)
        required: true
    },
    slotEndTime: {
        type: String, // Format: "10:15" (24-hour)
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'no-show', 'in-progress', 'reschedule_required'],
        default: 'scheduled'
    },
    // ── Staff Approval Workflow ────────────────────────────────────────────
    staffApprovalStatus: {
        type: String,
        enum: ['pending_review', 'approved', 'rejected'],
        default: 'pending_review'
    },
    initialDiagnosis: {
        type: String,
        default: ''
    },
    staffNotes: {
        type: String,
        default: ''
    },
    staffReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    staffReviewedAt: {
        type: Date,
        default: null
    },
    bookingType: {
        type: String,
        enum: ['appointment', 'walkin'],
        default: 'appointment'
    },
    tokenNumber: {
        type: Number // For walk-in patients
    },
    consultationCharge: {
        type: Number,
        required: true
    },
    visitType: {
        type: String,
        enum: ['OPD', 'Online'],
        default: 'OPD'
    },
    notes: {
        type: String
    },
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Can be patient or staff
    },
    // ── Reschedule / Postpone tracking ──────────────────────────────────
    rescheduledFrom: {
        type: Date,
        default: null
    },
    rescheduledAt: {
        type: Date,
        default: null
    },
    rescheduledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    postponeCharge: {
        type: Number,
        default: 0   // extra fee charged when patient / staff reschedules
    },
    rescheduleCount: {
        type: Number,
        default: 0   // how many times this appointment has been rescheduled
    },
    rescheduleNote: {
        type: String,
        default: ''  // reason / note for the reschedule (e.g. doctor emergency)
    },
    // ── Smart Diagnosis Fields ─────────────────────────────────────────────
    symptoms: {
        type: String,
        default: ''
    },
    severity: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe', ''],
        default: ''
    },
    diseaseType: {
        type: String,
        default: ''
    },
    // ── Family Member Booking ──────────────────────────────────────────────
    bookedForMember: {
        memberId: {
            type: String,   // _id of the family member sub-document
            default: null
        },
        memberName: {
            type: String,
            default: null
        },
        relation: {
            type: String,
            default: null
        }
    },
    // ── Payment Details ────────────────────────────────────────────────────
    paymentDetails: {
        method: {
            type: String,
            default: 'UPI'
        },
        transactionId: {
            type: String, // UTR number
            default: ''
        },
        screenshot: {
            type: String, // Path to uploaded image
            default: ''
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        verifiedAt: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, slotStartTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
