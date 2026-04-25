const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    roleType: {
        type: String,
        enum: ['Reception', 'Support'],
        required: true
    },
    department: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    shiftTime: {
        type: String,
        enum: ['Morning', 'Evening', 'Night'],
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Staff', staffSchema);
