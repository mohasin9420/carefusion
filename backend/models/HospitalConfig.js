const mongoose = require('mongoose');

const hospitalConfigSchema = new mongoose.Schema({
    hospitalName: {
        type: String,
        required: true
    },
    hospitalLogo: String,
    // Contact Information
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: String
    },
    contactNumbers: {
        main: String,
        emergency: String,
        ambulance: String,
        helpdesk: String
    },
    email: {
        main: String,
        support: String,
        emergency: String
    },
    website: String,

    // Working Hours
    workingHours: {
        monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        friday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        saturday: { start: String, end: String, isWorking: { type: Boolean, default: false } },
        sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
    },

    // Consultation Fees
    consultationFees: {
        general: {
            type: Number,
            default: 500
        },
        specialist: {
            type: Number,
            default: 1000
        },
        emergency: {
            type: Number,
            default: 1500
        },
        followUp: {
            type: Number,
            default: 300
        }
    },

    // System Configuration
    appointmentSettings: {
        slotDuration: {
            type: Number,
            default: 30 // minutes
        },
        maxBookingDaysAhead: {
            type: Number,
            default: 30 // days
        },
        allowCancellation: {
            type: Boolean,
            default: true
        },
        cancellationDeadlineHours: {
            type: Number,
            default: 24 // hours before appointment
        }
    },

    // Multi-Branch Support
    branches: [{
        branchId: {
            type: String,
            unique: true
        },
        branchName: String,
        address: {
            street: String,
            city: String,
            state: String,
            pincode: String
        },
        contactNumber: String,
        email: String,
        isHeadquarters: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    }],

    // Email/SMS Configuration
    notifications: {
        emailEnabled: {
            type: Boolean,
            default: true
        },
        smsEnabled: {
            type: Boolean,
            default: false
        },
        appointmentReminders: {
            type: Boolean,
            default: true
        },
        reminderHoursBefore: {
            type: Number,
            default: 24
        }
    },

    // Security Settings
    security: {
        passwordMinLength: {
            type: Number,
            default: 8
        },
        passwordExpiryDays: {
            type: Number,
            default: 90
        },
        maxLoginAttempts: {
            type: Number,
            default: 5
        },
        sessionTimeoutMinutes: {
            type: Number,
            default: 60
        }
    },

    // Backup Configuration
    backup: {
        autoBackupEnabled: {
            type: Boolean,
            default: false
        },
        backupFrequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            default: 'weekly'
        },
        lastBackupDate: Date,
        backupLocation: String
    },
    // AI Provider API Keys (managed by admin)
    apiKeys: [{
        provider: {
            type: String,
            enum: ['groq', 'mistral', 'gemini', 'openai', 'anthropic', 'azure-openai', 'other'],
            required: true
        },
        keyLabel: { type: String, required: true },   // e.g. "Main Gemini Key"
        keyValue: { type: String, required: true },   // the actual API key
        isActive: { type: Boolean, default: true },
        addedAt: { type: Date, default: Date.now }
    }],
    paymentSettings: {
        defaultUpiId: {
            type: String,
            default: "hospital@upi"
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('HospitalConfig', hospitalConfigSchema);
