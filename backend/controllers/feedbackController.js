const Feedback = require('../models/Feedback');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// @desc    Submit feedback (Patient only)
// @route   POST /api/feedback
// @access  Private/Patient
exports.submitFeedback = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const { appointmentId, rating, comment, category } = req.body;

        if (!appointmentId || !rating) {
            return res.status(400).json({ message: 'Appointment ID and rating (1-5) are required' });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment || appointment.patientId.toString() !== patient._id.toString()) {
            return res.status(404).json({ message: 'Appointment not found or access denied' });
        }

        if (appointment.status !== 'completed') {
            return res.status(400).json({ message: 'Feedback can only be given for completed appointments' });
        }

        const existing = await Feedback.findOne({ appointmentId });
        if (existing) {
            return res.status(400).json({ message: 'Feedback already submitted for this appointment' });
        }

        const feedback = await Feedback.create({
            patientId: patient._id,
            appointmentId,
            doctorId: appointment.doctorId,
            rating: Math.min(5, Math.max(1, parseInt(rating))),
            comment: comment || '',
            category: category || 'consultation'
        });

        res.status(201).json(feedback);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get feedback for doctor (analytics)
// @route   GET /api/feedback/doctor/:doctorId
// @access  Private/Admin or Doctor
exports.getDoctorFeedback = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const feedbacks = await Feedback.find({ doctorId })
            .populate('patientId', 'fullName')
            .populate('appointmentId', 'appointmentDate')
            .sort({ createdAt: -1 });

        const avgRating = feedbacks.length
            ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(2)
            : 0;
        const ratingCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        feedbacks.forEach(f => { ratingCount[f.rating] = (ratingCount[f.rating] || 0) + 1; });

        res.json({ feedbacks, avgRating: parseFloat(avgRating), ratingCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all feedback (Admin analytics)
// @route   GET /api/feedback
// @access  Private/Admin
exports.getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate('patientId', 'fullName')
            .populate('doctorId', 'fullName specialization')
            .populate('appointmentId', 'appointmentDate')
            .sort({ createdAt: -1 })
            .limit(100);

        const stats = await Feedback.aggregate([
            { $group: { _id: '$rating', count: { $sum: 1 } } }
        ]);

        res.json({ feedbacks, stats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
