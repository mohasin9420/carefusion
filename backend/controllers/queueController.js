const Queue = require('../models/Queue');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// @desc    Get patient queue for doctor
// @route   GET /api/doctor/queue
// @access  Private/Doctor
exports.getQueue = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const { status } = req.query;
        const query = {
            doctorId: doctor._id,
            date: {
                $gte: new Date().setHours(0, 0, 0, 0),
                $lt: new Date().setHours(23, 59, 59, 999)
            }
        };

        if (status) {
            query.consultationStatus = status;
        } else {
            // Default: show waiting and in-progress
            query.consultationStatus = { $in: ['waiting', 'in-progress'] };
        }

        const queue = await Queue.find(query)
            .populate('patientId', 'fullName age gender mobile')
            .populate('appointmentId', 'timeSlot visitType')
            .sort({ priority: -1, tokenNumber: 1 }); // Urgent first, then by token

        res.json(queue);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Call next patient (move to in-progress)
// @route   PUT /api/doctor/queue/:id/call
// @access  Private/Doctor
exports.callNextPatient = async (req, res) => {
    try {
        const queueItem = await Queue.findById(req.params.id)
            .populate('patientId', 'fullName age gender mobile');

        if (!queueItem) {
            return res.status(404).json({ message: 'Queue item not found' });
        }

        queueItem.consultationStatus = 'in-progress';
        queueItem.actualStartTime = new Date();
        await queueItem.save();

        // Update appointment status if linked
        if (queueItem.appointmentId) {
            await Appointment.findByIdAndUpdate(queueItem.appointmentId, {
                status: 'in-progress'
            });
        }

        res.json({
            message: 'Patient called successfully',
            queue: queueItem
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update appointment/queue status
// @route   PUT /api/doctor/appointment/:id/status
// @access  Private/Doctor
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { status, notes } = req.body; // completed, cancelled, no-show

        if (!['completed', 'cancelled', 'no-show', 'in-progress'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const appointment = await Appointment.findById(req.params.id)
            .populate('patientId', 'fullName');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appointment.status = status;
        if (notes) appointment.notes = notes;
        await appointment.save();

        // Update queue if exists
        const queueItem = await Queue.findOne({ appointmentId: appointment._id });
        if (queueItem) {
            queueItem.consultationStatus = status;
            if (status === 'completed' || status === 'no-show' || status === 'cancelled') {
                queueItem.actualEndTime = new Date();
            }
            if (notes) queueItem.notes = notes;
            await queueItem.save();
        }

        res.json({
            message: `Appointment marked as ${status}`,
            appointment
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create emergency appointment slot
// @route   POST /api/doctor/emergency-slot
// @access  Private/Doctor
exports.createEmergencySlot = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const { patientId, timeSlot, notes } = req.body;

        if (!patientId || !timeSlot) {
            return res.status(400).json({ message: 'Patient ID and time slot are required' });
        }

        // Create emergency appointment
        const appointment = await Appointment.create({
            patientId,
            doctorId: doctor._id,
            date: new Date(),
            timeSlot,
            bookingType: 'emergency',
            visitType: 'walkin',
            status: 'confirmed',
            consultationCharges: doctor.consultationFees || 0
        });

        // Add to queue with high priority
        const queue = await Queue.create({
            patientId,
            doctorId: doctor._id,
            appointmentId: appointment._id,
            appointmentType: 'emergency',
            priority: 'urgent',
            estimatedWaitTime: 5, // Emergency gets 5 min wait
            addedBy: req.user._id,
            consultationStatus: 'waiting',
            notes
        });

        const populatedQueue = await Queue.findById(queue._id)
            .populate('patientId', 'fullName age gender mobile');

        res.status(201).json({
            message: 'Emergency slot created successfully',
            appointment,
            queue: populatedQueue
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
