const DoctorAvailability = require('../models/DoctorAvailability');
const BlockedSlot = require('../models/BlockedSlot');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const slotService = require('../services/slotService');
const aiService = require('../services/aiService');
const Doctor = require('../models/Doctor');

// Helper: find appointments affected by block and set reschedule_required + notify patients
async function markAffectedAppointmentsRescheduleAndNotify(doctorId, blockedDate, isFullDay, startTime, endTime) {
    const dayStart = new Date(blockedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(blockedDate);
    dayEnd.setHours(23, 59, 59, 999);

    let query = {
        doctorId,
        appointmentDate: { $gte: dayStart, $lte: dayEnd },
        status: 'scheduled'
    };
    if (!isFullDay && startTime && endTime) {
        // Partial block: appointment slot must overlap [startTime, endTime]
        query.$or = [
            { slotStartTime: { $lt: endTime }, slotEndTime: { $gt: startTime } }
        ];
    }

    const affected = await Appointment.find(query).populate('patientId', 'userId fullName');
    if (affected.length === 0) return { count: 0 };

    await Appointment.updateMany(
        { _id: { $in: affected.map(a => a._id) } },
        { status: 'reschedule_required' }
    );

    const doctor = await Doctor.findById(doctorId).select('fullName').lean();
    const doctorName = doctor?.fullName || 'Your doctor';
    const dateStr = new Date(blockedDate).toLocaleDateString();

    for (const apt of affected) {
        const patientUserId = apt.patientId?.userId;
        if (patientUserId) {
            await Notification.create({
                userId: patientUserId,
                type: 'reschedule',
                title: 'Reschedule Required',
                message: `Dr. ${doctorName} is unavailable on ${dateStr}. Please choose a new slot for your appointment.`,
                data: {
                    appointmentId: apt._id,
                    doctorId,
                    blockedDate: new Date(blockedDate)
                }
            });
        }
    }
    return { count: affected.length };
}

// @desc    Set or update doctor weekly availability
// @route   POST /api/availability/set-schedule
// @access  Private/Staff
exports.setDoctorAvailability = async (req, res) => {
    try {
        const { doctorId, schedule } = req.body;
        // schedule = array of: [{ dayOfWeek, startTime, endTime, slotDuration, maxPatientsPerSlot }]

        if (!doctorId || !schedule || !Array.isArray(schedule)) {
            return res.status(400).json({ message: 'Doctor ID and schedule array required' });
        }

        // Verify doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Delete existing schedule for this doctor
        await DoctorAvailability.deleteMany({ doctorId });

        // Create new schedule
        const availabilityRecords = schedule.map(s => ({
            doctorId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            slotDuration: s.slotDuration || 15,
            maxPatientsPerSlot: s.maxPatientsPerSlot || 1
        }));

        const availability = await DoctorAvailability.insertMany(availabilityRecords);

        res.json({
            message: 'Doctor availability set successfully',
            availability
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get doctor's weekly availability
// @route   GET /api/availability/doctor/:doctorId
// @access  Private
exports.getDoctorAvailability = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const availability = await DoctorAvailability.find({
            doctorId,
            isActive: true
        }).sort({ dayOfWeek: 1 });

        res.json(availability);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get available slots for a doctor on a specific date
// @route   GET /api/availability/slots
// @access  Private
exports.getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({ message: 'Doctor ID and date required' });
        }

        const slots = await slotService.generateSlots(doctorId, new Date(date));

        res.json(slots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Block specific date/time slots
// @route   POST /api/availability/block-slots
// @access  Private/Staff
exports.blockSlots = async (req, res) => {
    try {
        const {
            doctorId,
            blockedDate,
            reason,
            isFullDay = true,
            startTime,
            endTime,
            notes
        } = req.body;

        if (!doctorId || !blockedDate) {
            return res.status(400).json({ message: 'Doctor ID and blocked date required' });
        }

        // Create blocked slot record
        const blocked = await BlockedSlot.create({
            doctorId,
            blockedDate: new Date(blockedDate),
            reason,
            isFullDay,
            startTime,
            endTime,
            notes,
            createdBy: req.user._id
        });

        // Mark affected scheduled appointments as reschedule_required and notify patients
        const { count: affectedCount } = await markAffectedAppointmentsRescheduleAndNotify(
            doctorId,
            blockedDate,
            isFullDay,
            startTime,
            endTime
        );

        return res.json({
            message: isFullDay ? 'Full-day block set. Affected appointments require reschedule.' : 'Slots blocked successfully.',
            blocked,
            affectedAppointments: affectedCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Unblock (delete) a blocked slot
// @route   DELETE /api/availability/block-slots/:id
// @access  Private/Staff
exports.unblockSlots = async (req, res) => {
    try {
        const { id } = req.params;

        const blocked = await BlockedSlot.findByIdAndDelete(id);

        if (!blocked) {
            return res.status(404).json({ message: 'Blocked slot not found' });
        }

        res.json({ message: 'Slot unblocked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all blocked slots for a doctor
// @route   GET /api/availability/blocked-slots/:doctorId
// @access  Private/Staff
exports.getBlockedSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const blockedSlots = await BlockedSlot.find({ doctorId })
            .populate('createdBy', 'email')
            .sort({ blockedDate: 1 });

        res.json(blockedSlots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all doctors with their availability status
// @route   GET /api/availability/all-doctors
// @access  Private (all authenticated users)
exports.getAllDoctorsAvailability = async (req, res) => {
    try {
        const doctors = await Doctor.find().select('fullName specialization department consultationFee upiId');

        const doctorsWithAvailability = await Promise.all(
            doctors.map(async (doctor) => {
                const availability = await DoctorAvailability.find({
                    doctorId: doctor._id,
                    isActive: true
                });

                return {
                    ...doctor.toObject(),
                    hasSchedule: availability.length > 0,
                    scheduleCount: availability.length
                };
            })
        );

        res.json(doctorsWithAvailability);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get AI-suggested available slots (prioritizes less crowded)
// @route   GET /api/availability/ai-slots
// @access  Private
exports.getAISuggestedSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) {
            return res.status(400).json({ message: 'Doctor ID and date required' });
        }
        const slots = await aiService.getAISuggestedSlots(doctorId, date);
        res.json(slots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Doctor: block own availability (full-day leave, partial slots, or emergency)
// @route   POST /api/availability/my-block
// @access  Private/Doctor
exports.blockMySlots = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const {
            blockedDate,
            reason = 'leave',
            isFullDay = true,
            startTime,
            endTime,
            notes
        } = req.body;

        if (!blockedDate) {
            return res.status(400).json({ message: 'Blocked date is required' });
        }

        const blocked = await BlockedSlot.create({
            doctorId: doctor._id,
            blockedDate: new Date(blockedDate),
            reason: ['leave', 'emergency', 'conference', 'surgery', 'other'].includes(reason) ? reason : 'other',
            isFullDay: !!isFullDay,
            startTime: isFullDay ? undefined : startTime,
            endTime: isFullDay ? undefined : endTime,
            notes,
            createdBy: req.user._id
        });

        const { count: affectedCount } = await markAffectedAppointmentsRescheduleAndNotify(
            doctor._id,
            blockedDate,
            !!isFullDay,
            startTime,
            endTime
        );

        return res.json({
            message: isFullDay ? 'Full-day leave marked. Affected patients will be notified to reschedule.' : 'Time slots blocked. Affected patients will be notified.',
            blocked,
            affectedAppointments: affectedCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Doctor: get own blocked slots
// @route   GET /api/availability/my-blocked-slots
// @access  Private/Doctor
exports.getMyBlockedSlots = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const blockedSlots = await BlockedSlot.find({ doctorId: doctor._id })
            .sort({ blockedDate: 1 });

        res.json(blockedSlots);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Doctor: unblock own slot
// @route   DELETE /api/availability/my-blocked-slots/:id
// @access  Private/Doctor
exports.unblockMySlot = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const blocked = await BlockedSlot.findOne({
            _id: req.params.id,
            doctorId: doctor._id
        });

        if (!blocked) {
            return res.status(404).json({ message: 'Blocked slot not found' });
        }

        await BlockedSlot.findByIdAndDelete(blocked._id);
        res.json({ message: 'Slot unblocked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;
