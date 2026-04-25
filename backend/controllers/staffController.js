const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const Staff = require('../models/Staff');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// @desc    Get daily queue
// @route   GET /api/staff/queue
// @access  Private/Staff
exports.getDailyQueue = async (req, res) => {
    try {
        const { date } = req.query;
        const queryDate = date ? new Date(date) : new Date();
        queryDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(queryDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const queue = await Queue.find({
            date: { $gte: queryDate, $lt: nextDay }
        })
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization')
            .sort({ tokenNumber: 1 });

        res.json(queue);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add patient to queue
// @route   POST /api/staff/queue
// @access  Private/Staff
exports.addToQueue = async (req, res) => {
    try {
        const staff = await Staff.findOne({ userId: req.user._id });

        if (!staff) {
            return res.status(404).json({ message: 'Staff profile not found' });
        }

        const { patientId, doctorId, notes } = req.body;

        const queueEntry = await Queue.create({
            patientId,
            doctorId,
            notes,
            addedBy: staff._id
        });

        const populatedEntry = await Queue.findById(queueEntry._id)
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization');

        res.status(201).json(populatedEntry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update queue status
// @route   PUT /api/staff/queue/:id
// @access  Private/Staff
exports.updateQueueStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const queueEntry = await Queue.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        )
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization');

        if (!queueEntry) {
            return res.status(404).json({ message: 'Queue entry not found' });
        }

        res.json(queueEntry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get appointments
// @route   GET /api/staff/appointments
// @access  Private/Staff
exports.getAppointments = async (req, res) => {
    try {
        const { date } = req.query;
        let query = {};

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.appointmentDate = { $gte: startDate, $lte: endDate };
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization department')
            .sort({ appointmentDate: 1, timeSlot: 1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Book appointment for patient
// @route   POST /api/staff/appointment
// @access  Private/Staff
exports.bookAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, appointmentDate, timeSlot, notes } = req.body;

        const appointment = await Appointment.create({
            patientId,
            doctorId,
            appointmentDate,
            timeSlot,
            notes,
            bookedBy: req.user._id
        });

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization department');

        res.status(201).json(populatedAppointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all patients (for search/selection)
// @route   GET /api/staff/patients
// @access  Private/Staff
exports.getPatients = async (req, res) => {
    try {
        const patients = await Patient.find()
            .select('fullName age gender mobile familyMembers')
            .sort({ fullName: 1 });

        res.json(patients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all doctors (for appointment booking)
// @route   GET /api/staff/doctors
// @access  Private/Staff
exports.getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find()
            .select('fullName specialization department availability')
            .sort({ fullName: 1 });

        res.json(doctors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
