const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const prescriptionSchema = new mongoose.Schema({
    prescriptionId: {
        type: String,
        unique: true,
        default: () => `RX-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`
    },
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
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    // Who this prescription was issued for (null = main account holder)
    bookedForMember: {
        memberId: { type: String, default: null },
        memberName: { type: String, default: null },
        relation: { type: String, default: null }
    },
    diagnosis: {
        type: String,
        required: true
    },
    medicines: [{
        medicineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MedicineCatalog'
        },
        name: {
            type: String,
            required: true
        },
        dosage: {
            type: String,
            required: true
        },
        frequency: {
            type: String,
            required: true
        },
        duration: {
            type: String,
            required: true
        },
        timing: {
            type: String,
            default: 'After Meal'
        },
        instructions: String
    }],
    labTestsRequested: [{
        testId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DiagnosticTestCatalog'
        },
        name: {
            type: String,
            required: true
        }
    }],
    notes: String,
    status: {
        type: String,
        enum: ['pending', 'ready', 'out_of_stock', 'dispensed'],
        default: 'pending'
    },
    digitalSignature: {
        type: String,
        default: null
    },
    signedAt: Date,
    pdfPath: String,
    dispensedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy'
    },
    dispensedAt: Date,
    // QR Code and Sharing
    qrCode: {
        type: String // Base64 encoded QR code image
    },
    verificationCode: {
        type: String // For QR code verification
    },
    sharedWith: [{
        email: String,
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

prescriptionSchema.index({ prescriptionId: 1 });
prescriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
