const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: String,
    category: {
        type: String,
        enum: ['consultation', 'pharmacy', 'laboratory', 'overall'],
        default: 'overall'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

feedbackSchema.index({ doctorId: 1 });
feedbackSchema.index({ appointmentId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
