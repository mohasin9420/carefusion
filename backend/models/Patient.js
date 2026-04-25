const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    age: {
        type: Number
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    mobile: {
        type: String
    },
    address: {
        type: String
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    // Enhanced Profile Fields
    profilePhoto: {
        type: String, // URL or file path
        default: null
    },
    // Health Information
    allergies: [{
        allergen: String, // e.g., "Penicillin", "Peanuts"
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
            default: 'moderate'
        },
        reaction: String, // e.g., "Rash", "Anaphylaxis"
        diagnosedDate: Date
    }],
    chronicDiseases: [{
        disease: String, // e.g., "Diabetes", "Hypertension"
        diagnosedDate: Date,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
            default: 'moderate'
        },
        currentStatus: {
            type: String,
            enum: ['active', 'controlled', 'in-remission'],
            default: 'active'
        },
        notes: String
    }],
    vaccinations: [{
        vaccineName: String,
        dateAdministered: Date,
        nextDueDate: Date,
        administeredBy: String,
        batchNumber: String
    }],
    // Insurance Details
    insuranceDetails: {
        provider: String,
        policyNumber: String,
        coverageAmount: Number,
        validFrom: Date,
        validTo: Date,
        policyHolderName: String,
        relation: String // self, spouse, parent, child
    },
    // Emergency Contacts (multiple)
    emergencyContacts: [{
        name: String,
        relation: String,
        mobile: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    // Family Members (inline – no separate registration required)
    familyMembers: [{
        name: {
            type: String,
            required: true
        },
        relation: {
            type: String,
            enum: ['mother', 'father', 'child', 'spouse', 'sibling', 'other'],
            required: true
        },
        age: {
            type: Number
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other']
        },
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);
