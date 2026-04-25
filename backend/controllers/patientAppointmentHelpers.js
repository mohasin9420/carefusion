// Patient controller - New appointment features

const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// @desc    Search doctors with filters
// @route   GET /api/patient/doctors/search
// @access  Private/Patient
exports.searchDoctors = async (req, res) => {
    try {
        const { specialization, experience, rating, name } = req.query;

        //Build query
        const query = {};

        if (specialization) {
            query.specialization = { $regex: specialization, $options: 'i' };
        }

        if (experience) {
            query.experience = { $gte: parseInt(experience) };
        }

        if (name) {
            query.fullName = { $regex: name, $options: 'i' };
        }

        // Get doctors
        let doctors = await Doctor.find(query)
            .populate('userId', 'email status')
            .select('fullName specialization experience qualification department contactNumber availability');

        // Add ratings to doctors
        const doctorIds = doctors.map(d => d._id);

        const ratings = await Feedback.aggregate([
            { $match: { doctorId: { $in: doctorIds } } },
            { $group: { _id: '$doctorId', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
        ]);

        const ratingMap = {};
        ratings.forEach(r => {
            ratingMap[r._id.toString()] = { rating: r.avgRating, reviews: r.totalReviews };
        });

        doctors = doctors.map(doc => {
            const docObj = doc.toObject();
            const ratingData = ratingMap[doc._id.toString()];
            docObj.averageRating = ratingData?.rating || 0;
            docObj.totalReviews = ratingData?.reviews || 0;
            return docObj;
        });

        // Filter by rating if specified
        if (rating) {
            doctors = doctors.filter(doc => doc.averageRating >= parseFloat(rating));
        }

        res.json(doctors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get available slots for a doctor
// @route   GET /api/patient/doctors/:id/available-slots
// @access  Private/Patient
exports.getAvailableSlots = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const requestedDate = new Date(date);
        const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });

        // Get doctor's availability for this day
        const dayAvailability = doctor.availability?.find(a => a.day === dayOfWeek && a.startTime && a.endTime);

        if (!dayAvailability) {
            return res.json({
                availableSlots: [],
                message: `Doctor not available on ${dayOfWeek}`
            });
        }

        // Get all booked appointments for this date
        const bookedAppointments = await Appointment.find({
            doctorId: doctor._id,
            appointmentDate: {
                $gte: new Date(date).setHours(0, 0, 0, 0),
                $lt: new Date(date).setHours(23, 59, 59, 999)
            },
            status: { $in: ['scheduled', 'in-progress', 'confirmed'] }
        }).select('slotStartTime slotEndTime');

        const bookedSlots = bookedAppointments.map(apt => `${apt.slotStartTime}-${apt.slotEndTime}`);

        // Generate all possible slots
        const allSlots = generateTimeSlots(dayAvailability.startTime, dayAvailability.endTime);

        // Filter out booked slots
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        res.json({
            doctor: {
                name: doctor.fullName,
                specialization: doctor.specialization
            },
            date,
            day: dayOfWeek,
            availableSlots,
            totalSlots: allSlots.length,
            bookedSlots: bookedSlots.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to generate time slots
function generateTimeSlots(startTime, endTime, slotDuration = 30) {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const nextMin = currentMin + slotDuration;
        const nextHour = currentHour + Math.floor(nextMin / 60);
        const finalMin = nextMin % 60;

        if (nextHour > endHour || (nextHour === endHour && finalMin > endMin)) {
            break;
        }

        const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        const slotEnd = `${String(nextHour).padStart(2, '0')}:${String(finalMin).padStart(2, '0')}`;

        slots.push(`${slotStart}-${slotEnd}`);

        currentHour = nextHour;
        currentMin = finalMin;
    }

    return slots;
}

// @desc    Book emergency appointment
// @route   POST /api/patient/appointments/emergency
// @access  Private/Patient
exports.bookEmergencyAppointment = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });
        const { doctorId, symptoms, notes } = req.body;

        if (!doctorId) {
            return res.status(400).json({ message: 'Doctor ID is required' });
        }

        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Create emergency appointment
        const appointment = await Appointment.create({
            patientId: patient._id,
            doctorId: doctor._id,
            appointmentDate: new Date(),
            slotStartTime: 'Emergency',
            slotEndTime: 'Emergency',
            bookingType: 'emergency',
            visitType: 'OPD',
            status: 'scheduled',
            consultationCharge: 0, // Emergency consultation
            notes: `EMERGENCY: ${symptoms || notes || 'No details provided'}`,
            bookedBy: req.user._id
        });

        // Add to queue if Queue model exists
        try {
            const Queue = require('../models/Queue');
            await Queue.create({
                patientId: patient._id,
                doctorId: doctor._id,
                appointmentId: appointment._id,
                appointmentType: 'emergency',
                priority: 'urgent',
                estimatedWaitTime: 5,
                addedBy: req.user._id,
                notes: `Emergency: ${symptoms || 'No symptoms provided'}`
            });
        } catch (queueError) {
            console.log('Queue creation skipped:', queueError.message);
        }

        res.status(201).json({
            message: 'Emergency appointment booked successfully',
            appointment,
            note: 'Please proceed to the hospital immediately'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// All functions already exported via exports.functionName above

