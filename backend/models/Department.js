const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    description: String,
    headOfDepartment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    doctors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    }],
    staff: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: String,
        assignedAt: {
            type: Date,
            default: Date.now
        }
    }],
    location: {
        building: String,
        floor: String,
        roomNumber: String
    },
    contactNumber: String,
    email: String,
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    workingHours: {
        monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        friday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
        saturday: { start: String, end: String, isWorking: { type: Boolean, default: false } },
        sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
    },
    // Performance Metrics
    totalPatients: {
        type: Number,
        default: 0
    },
    totalAppointments: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);
