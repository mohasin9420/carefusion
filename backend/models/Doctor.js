const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    specialization: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    qualification: {
        type: String,
        required: true
    },
    experience: {
        type: Number, // Years of experience
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    availability: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        startTime: String,
        endTime: String
    }],
    consultationFee: {
        type: Number,
        default: 500
    },
    upiId: {
        type: String,
        default: ""
    },
    profilePicture: {
        type: String,  // relative URL: /uploads/profiles/filename.jpg
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);
