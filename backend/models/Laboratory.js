const mongoose = require('mongoose');

const laboratorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    labType: {
        type: String,
        enum: ['Pathology', 'Radiology'],
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Laboratory', laboratorySchema);
