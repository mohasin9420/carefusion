const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pharmacistName: {
        type: String,
        required: true
    },
    licenseNumber: {
        type: String,
        required: true,
        unique: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    shiftTiming: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Pharmacy', pharmacySchema);
