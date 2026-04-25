const mongoose = require('mongoose');

const insuranceClaimSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
    },
    prescriptionIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
    }],
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },

    // Who this claim was filed for (null = main account holder)
    bookedForMember: {
        memberId: { type: String, default: null },
        memberName: { type: String, default: null },
        relation: { type: String, default: null }
    },

    // Claim type
    claimType: {
        type: String,
        enum: ['cashless', 'reimbursement'],
        default: 'cashless'
    },

    // Insurance details
    insuranceProvider: { type: String, trim: true },
    policyNumber: { type: String, trim: true },
    membershipId: { type: String, trim: true },

    // Clinical Information (used for coding)
    clinicalInfo: {
        diagnosis: String,
        symptoms: String,
        treatment: String,
        medicines: String,
        labTests: String,
        reportText: String
    },

    // Generated Codes
    icdCodes: [{
        code: String,
        description: String,
        confidence: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
    }],
    cptCodes: [{
        code: String,
        description: String,
        confidence: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
    }],
    codingNotes: String,

    // Claim Narrative
    claimNarrative: String,

    // Claim Status
    status: {
        type: String,
        enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid'],
        default: 'draft'
    },
    rejectionReason: String,
    claimAmount: Number,
    approvedAmount: Number,

    // Metadata
    aiGenerated: { type: Boolean, default: true },
    claimFileGeneratedAt: Date,
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    claimReference: { type: String, unique: true, sparse: true },
    shareWithPatient: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model('InsuranceClaim', insuranceClaimSchema);
