const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const slotService = require('../services/slotService');

// @desc    Book an appointment (slot-based)
// @route   POST /api/appointments/book
// @access  Private (Patient or Staff)
exports.bookAppointment = async (req, res) => {
    try {
        const {
            doctorId,
            patientId,
            appointmentDate,
            slotStartTime,
            slotEndTime,
            bookingType = 'appointment',
            consultationCharge,
            visitType = 'OPD',
            notes,
            bookedForMember = null,
            paymentDetails = {} // { transactionId }
        } = req.body;

        // Validate required fields (consultationCharge is now optional, will pull from doctor if missing)
        if (!doctorId || !patientId || !appointmentDate || !slotStartTime || !slotEndTime) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // ── Fetch Doctor for Fee/UPI if not provided ──────────────────────
        const doctor = await Doctor.findById(doctorId).select('consultationFee upiId fullName specialization').lean();
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const finalCharge = consultationCharge !== undefined ? consultationCharge : (doctor.consultationFee || 500);

        // ── Date range for the requested day ────────────────────────────────
        const dayStart = new Date(appointmentDate); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(appointmentDate); dayEnd.setHours(23, 59, 59, 999);

        // ── 1. Same-day block (per individual member) ────────────
        // Each person (main account OR each family member) can only book ONE
        // appointment per day across the entire hospital.
        const incomingMemberId = bookedForMember?.memberId || null;

        const sameDayAppointment = await Appointment.findOne({
            patientId,
            appointmentDate: { $gte: dayStart, $lte: dayEnd },
            status: { $nin: ['cancelled'] },
            'bookedForMember.memberId': incomingMemberId
        });

        if (sameDayAppointment) {
            const whoName = bookedForMember?.memberName
                ? `${bookedForMember.memberName} (${bookedForMember.relation})`
                : 'You (main account)';
            return res.status(400).json({
                message: `${whoName} already has an appointment today. Each person can only book one appointment per day.`
            });
        }

        // ── 2. Family-size daily slot limit ─────────────────────────────────
        // Total allowed = 1 (main patient) + number of family members
        const patient = await Patient.findById(patientId).select('familyMembers userId').lean();
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        const maxSlotsPerDay = 1 + (patient.familyMembers ? patient.familyMembers.length : 0);

        const sameDayCount = await Appointment.countDocuments({
            patientId,
            appointmentDate: { $gte: dayStart, $lte: dayEnd },
            status: { $nin: ['cancelled'] }
        });

        if (sameDayCount >= maxSlotsPerDay) {
            return res.status(400).json({
                message: `Daily booking limit reached for your account (${maxSlotsPerDay} slot${maxSlotsPerDay > 1 ? 's' : ''} allowed per day based on your family size of ${maxSlotsPerDay}).`
            });
        }

        // ── 3. Slot availability check ───────────────────────────────────────
        const isAvailable = await slotService.isSlotAvailable(
            doctorId,
            new Date(appointmentDate),
            slotStartTime,
            slotEndTime
        );

        if (!isAvailable) {
            return res.status(400).json({ message: 'Selected slot is not available' });
        }

        // ── 4. Create appointment ────────────────────────────────────────────
        const appointmentData = {
            doctorId,
            patientId,
            appointmentDate: new Date(appointmentDate),
            slotStartTime,
            slotEndTime,
            bookingType,
            consultationCharge: finalCharge,
            visitType,
            notes,
            bookedBy: req.user._id,
            status: 'scheduled',
            staffApprovalStatus: 'pending_review',   // <-- must be reviewed by staff first
            bookedForMember: bookedForMember && bookedForMember.memberId
                ? {
                    memberId: bookedForMember.memberId,
                    memberName: bookedForMember.memberName,
                    relation: bookedForMember.relation
                }
                : { memberId: null, memberName: null, relation: null },
            paymentDetails: {
                transactionId: paymentDetails?.transactionId || '',
                method: paymentDetails?.method || 'UPI',
                paymentStatus: 'pending'
            }
        };

        // If walk-in, assign token number
        if (bookingType === 'walkin') {
            const tokenNumber = await slotService.getNextTokenNumber(doctorId, new Date(appointmentDate));
            appointmentData.tokenNumber = tokenNumber;
        }

        const appointment = await Appointment.create(appointmentData);

        // Populate doctor and patient details
        await appointment.populate([
            { path: 'doctorId', select: 'fullName specialization department' },
            { path: 'patientId', select: 'fullName mobile userId' }
        ]);

        // Send confirmation notification to patient
        if (patient?.userId) {
            const doctorName = doctor?.fullName || 'Doctor';
            const forWhom = bookedForMember?.memberName
                ? `for ${bookedForMember.memberName} (${bookedForMember.relation})`
                : 'for you';
            await Notification.create({
                userId: patient.userId,
                type: 'appointment',
                title: 'Appointment Requested',
                message: `Appointment ${forWhom} with Dr. ${doctorName} on ${new Date(appointmentDate).toLocaleDateString()} at ${slotStartTime} is awaiting staff confirmation.`,
                data: { appointmentId: appointment._id }
            });
        }

        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// @desc    Get patient's appointments
// @route   GET /api/appointments/my-appointments
// @access  Private/Patient
exports.getMyAppointments = async (req, res) => {
    try {
        const { patientId } = req.query;

        if (!patientId) {
            return res.status(400).json({ message: 'Patient ID required' });
        }

        const appointments = await Appointment.find({ patientId })
            .populate('doctorId', 'fullName specialization department')
            .sort({ appointmentDate: -1, slotStartTime: -1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get doctor's schedule for a specific date
// @route   GET /api/appointments/doctor-schedule
// @access  Private/Doctor/Staff
exports.getDoctorSchedule = async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({ message: 'Doctor ID and date required' });
        }

        const appointments = await Appointment.find({
            doctorId,
            appointmentDate: {
                $gte: new Date(date).setHours(0, 0, 0, 0),
                $lt: new Date(date).setHours(23, 59, 59, 999)
            },
            status: { $ne: 'cancelled' },
            // Only show staff-approved appointments to doctors.
            // null/undefined = old data before this feature (treat as approved)
            $or: [
                { staffApprovalStatus: 'approved' },
                { staffApprovalStatus: { $exists: false } },
                { staffApprovalStatus: null }
            ]
        })
            .populate('patientId', 'fullName mobile age gender')
            .sort({ slotStartTime: 1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/cancel/:id
// @access  Private (Patient or Staff)
exports.cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.status === 'completed') {
            return res.status(400).json({ message: 'Cannot cancel completed appointment' });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        res.json({ message: 'Appointment cancelled successfully', appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update appointment status (for doctors)
// @route   PUT /api/appointments/status/:id
// @access  Private/Doctor/Staff
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['scheduled', 'in-progress', 'completed', 'no-show'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('patientId', 'fullName mobile');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.json({ message: 'Status updated successfully', appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all appointments (for admin/staff)
// @route   GET /api/appointments/all
// @access  Private/Admin/Staff
exports.getAllAppointments = async (req, res) => {
    try {
        const { status, date, doctorId } = req.query;

        let query = {};

        if (status) query.status = status;
        if (doctorId) query.doctorId = doctorId;
        if (date) {
            query.appointmentDate = {
                $gte: new Date(date).setHours(0, 0, 0, 0),
                $lt: new Date(date).setHours(23, 59, 59, 999)
            };
        }

        const appointments = await Appointment.find(query)
            .populate('doctorId', 'fullName specialization department')
            .populate('patientId', 'fullName mobile')
            .sort({ appointmentDate: 1, slotStartTime: 1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reschedule appointment (with optional postpone charge)
// @route   PUT /api/appointments/reschedule/:id
// @access  Private (Patient or Staff)
exports.rescheduleAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            newDate,
            newSlotStartTime,
            newSlotEndTime,
            postponeCharge = 100,
            rescheduleNote = ''
        } = req.body;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (['completed', 'in-progress', 'cancelled'].includes(appointment.status)) {
            return res.status(400).json({
                message: `Cannot reschedule an appointment that is already ${appointment.status}`
            });
        }

        if (appointment.status !== 'scheduled') {
            return res.status(400).json({ message: 'Can only reschedule scheduled appointments' });
        }

        // Check if new slot is available
        const isAvailable = await slotService.isSlotAvailable(
            appointment.doctorId,
            new Date(newDate),
            newSlotStartTime,
            newSlotEndTime
        );

        if (!isAvailable) {
            return res.status(400).json({ message: 'New slot is not available' });
        }

        // Save original date before overwriting
        const originalDate = appointment.appointmentDate;

        // Update appointment
        appointment.rescheduledFrom = originalDate;
        appointment.rescheduledAt = new Date();
        appointment.rescheduledBy = req.user._id;
        appointment.postponeCharge = Number(postponeCharge) || 100;
        appointment.rescheduleCount = (appointment.rescheduleCount || 0) + 1;
        appointment.rescheduleNote = rescheduleNote;
        appointment.appointmentDate = new Date(newDate);
        appointment.slotStartTime = newSlotStartTime;
        appointment.slotEndTime = newSlotEndTime;
        await appointment.save();

        // Notify patient
        const patient = await Patient.findById(appointment.patientId).select('userId').lean();
        if (patient?.userId) {
            const doctor = await Doctor.findById(appointment.doctorId).select('fullName').lean();
            const doctorName = doctor?.fullName || 'Doctor';
            await Notification.create({
                userId: patient.userId,
                type: 'appointment',
                title: 'Appointment Rescheduled',
                message: `Your appointment with Dr. ${doctorName} has been rescheduled to ${new Date(newDate).toLocaleDateString()} at ${newSlotStartTime}. Postponement charge: ₹${postponeCharge}.`,
                data: { appointmentId: appointment._id }
            });
        }

        res.json({ message: 'Appointment rescheduled successfully', appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get the default postpone charge for an appointment
// @route   GET /api/appointments/postpone-charge/:id
// @access  Private
exports.getPostponeCharge = async (req, res) => {
    try {
        // Default postpone charge is ₹100; staff can override when calling reschedule
        res.json({ defaultCharge: 100 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Bulk emergency shift – move all scheduled appointments for a doctor on a date
// @route   POST /api/appointments/emergency-shift
// @access  Private (Staff / Admin only)
exports.bulkEmergencyShift = async (req, res) => {
    try {
        const {
            doctorId,
            fromDate,
            toDate,
            reason = 'Doctor emergency – appointments rescheduled',
            postponeCharge = 100
        } = req.body;

        if (!doctorId || !fromDate || !toDate) {
            return res.status(400).json({ message: 'doctorId, fromDate, and toDate are required' });
        }

        const from = new Date(fromDate);
        const to = new Date(toDate);

        if (from.toDateString() === to.toDateString()) {
            return res.status(400).json({ message: 'From and To dates must be different' });
        }

        // Find all scheduled appointments for the doctor on fromDate
        const dayStart = new Date(from); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(from); dayEnd.setHours(23, 59, 59, 999);

        const appointments = await Appointment.find({
            doctorId,
            appointmentDate: { $gte: dayStart, $lte: dayEnd },
            status: 'scheduled'
        }).populate('patientId', 'userId fullName');

        if (appointments.length === 0) {
            return res.status(200).json({
                message: 'No scheduled appointments found for the selected doctor on that date',
                shifted: 0
            });
        }

        // Shift each appointment to toDate while preserving the time slots
        const shiftedIds = [];
        for (const apt of appointments) {
            const newAppointmentDate = new Date(to);
            newAppointmentDate.setHours(0, 0, 0, 0);

            // Keep the same time slots (just change the date part)
            const originalDate = apt.appointmentDate;
            apt.rescheduledFrom = originalDate;
            apt.rescheduledAt = new Date();
            apt.rescheduledBy = req.user._id;
            apt.postponeCharge = Number(postponeCharge) || 100;
            apt.rescheduleCount = (apt.rescheduleCount || 0) + 1;
            apt.rescheduleNote = reason;
            apt.appointmentDate = newAppointmentDate;
            await apt.save();
            shiftedIds.push(apt._id);

            // Notify patient
            if (apt.patientId?.userId) {
                const doctor = await Doctor.findById(doctorId).select('fullName').lean();
                const doctorName = doctor?.fullName || 'Doctor';
                await Notification.create({
                    userId: apt.patientId.userId,
                    type: 'appointment',
                    title: '⚠️ Appointment Rescheduled – Doctor Emergency',
                    message: `Your appointment with Dr. ${doctorName} originally on ${originalDate.toLocaleDateString()} has been moved to ${new Date(to).toLocaleDateString()} at ${apt.slotStartTime} due to: ${reason}.`,
                    data: { appointmentId: apt._id }
                });
            }
        }

        res.json({
            message: `${shiftedIds.length} appointment(s) successfully shifted to ${new Date(to).toLocaleDateString()}`,
            shifted: shiftedIds.length,
            toDate: to
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get appointments pending staff review
// @route   GET /api/appointments/pending-reviews
// @access  Private (Staff/Admin)
exports.getPendingReviews = async (req, res) => {
    try {
        const appointments = await Appointment.find({
            staffApprovalStatus: 'pending_review',
            status: { $ne: 'cancelled' }
        })
            .populate('doctorId', 'fullName specialization department')
            .populate('patientId', 'fullName mobile age gender')
            .sort({ appointmentDate: 1, slotStartTime: 1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Staff reviews (approve/reject) an appointment + adds initial diagnosis
// @route   PUT /api/appointments/review/:id
// @access  Private (Staff/Admin)
exports.reviewAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            decision, 
            initialDiagnosis = '', 
            staffNotes = '',
            symptoms = '',
            severity = '',
            diseaseType = ''
        } = req.body;

        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ message: 'Decision must be approved or rejected' });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            {
                staffApprovalStatus: decision,
                initialDiagnosis,
                staffNotes,
                symptoms,
                severity,
                diseaseType,
                staffReviewedBy: req.user._id,
                staffReviewedAt: new Date()
            },
            { new: true }
        )
            .populate('doctorId', 'fullName specialization')
            .populate('patientId', 'fullName mobile userId');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Notify patient
        const patientUserId = appointment.patientId?.userId;
        if (patientUserId) {
            const doctorName = appointment.doctorId?.fullName || 'Doctor';
            const dateStr = new Date(appointment.appointmentDate).toLocaleDateString();
            if (decision === 'approved') {
                await Notification.create({
                    userId: patientUserId,
                    type: 'appointment',
                    title: '✅ Appointment Confirmed',
                    message: `Your appointment with Dr. ${doctorName} on ${dateStr} at ${appointment.slotStartTime} has been confirmed by staff.`,
                    data: { appointmentId: appointment._id }
                });
            } else {
                await Notification.create({
                    userId: patientUserId,
                    type: 'appointment',
                    title: '❌ Appointment Rejected',
                    message: `Your appointment request with Dr. ${doctorName} on ${dateStr} at ${appointment.slotStartTime} was not approved. Please contact the hospital or rebook.`,
                    data: { appointmentId: appointment._id }
                });
            }
        }

        res.json({ message: `Appointment ${decision} successfully`, appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Staff books appointment on behalf of a patient (walk-in counter)
// @route   POST /api/appointments/staff-book
// @access  Private (Staff/Admin)
exports.staffBookAppointment = async (req, res) => {
    try {
        const {
            doctorId,
            patientId,
            appointmentDate,
            slotStartTime,
            slotEndTime,
            bookingType = 'walkin',
            consultationCharge,
            visitType = 'OPD',
            notes = '',
            symptoms = '',
            severity = '',
            diseaseType = ''
        } = req.body;

        if (!doctorId || !patientId || !appointmentDate || !slotStartTime || !slotEndTime) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // ── Same-day block (per individual member) ────────────
        const dayStart = new Date(appointmentDate); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(appointmentDate); dayEnd.setHours(23, 59, 59, 999);

        // Staff-bookings usually for the main patient unless they specify a member
        // For now, staff-book defaults to main patient (memberId: null)
        const sameDayAppointment = await Appointment.findOne({
            patientId,
            appointmentDate: { $gte: dayStart, $lte: dayEnd },
            status: { $nin: ['cancelled'] },
            'bookedForMember.memberId': null // Defaulting to main patient check
        });

        if (sameDayAppointment) {
            return res.status(400).json({
                message: `This patient already has an appointment today. Each person can only book one appointment per day.`
            });
        }

        const doctor = await Doctor.findById(doctorId).select('consultationFee').lean();
        const finalCharge = consultationCharge !== undefined ? consultationCharge : (doctor?.consultationFee || 500);

        // Check slot availability
        const isAvailable = await slotService.isSlotAvailable(
            doctorId,
            new Date(appointmentDate),
            slotStartTime,
            slotEndTime
        );

        if (!isAvailable) {
            return res.status(400).json({ message: 'Selected slot is not available' });
        }

        const appointmentData = {
            doctorId,
            patientId,
            appointmentDate: new Date(appointmentDate),
            slotStartTime,
            slotEndTime,
            bookingType,
            consultationCharge: finalCharge,
            visitType,
            notes,
            symptoms,
            severity,
            diseaseType,
            bookedBy: req.user._id,
            status: 'scheduled',
            staffApprovalStatus: 'approved',  // staff-booked = auto approved
            staffReviewedBy: req.user._id,
            staffReviewedAt: new Date(),
            bookedForMember: { memberId: null, memberName: null, relation: null }
        };

        if (bookingType === 'walkin') {
            const tokenNumber = await slotService.getNextTokenNumber(doctorId, new Date(appointmentDate));
            appointmentData.tokenNumber = tokenNumber;
        }

        const appointment = await Appointment.create(appointmentData);

        await appointment.populate([
            { path: 'doctorId', select: 'fullName specialization department' },
            { path: 'patientId', select: 'fullName mobile userId' }
        ]);

        // Notify patient
        const patient = await Patient.findById(patientId).select('userId').lean();
        if (patient?.userId) {
            const doctor = await Doctor.findById(doctorId).select('fullName').lean();
            const doctorName = doctor?.fullName || 'Doctor';
            await Notification.create({
                userId: patient.userId,
                type: 'appointment',
                title: '✅ Appointment Booked by Staff',
                message: `An appointment with Dr. ${doctorName} on ${new Date(appointmentDate).toLocaleDateString()} at ${slotStartTime} has been booked for you by hospital staff.`,
                data: { appointmentId: appointment._id }
            });
        }

        res.status(201).json({ message: 'Appointment booked successfully by staff', appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Upload payment screenshot for an appointment
// @route   POST /api/appointments/upload-screenshot/:id
// @access  Private (Patient/Staff)
exports.uploadPaymentScreenshot = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file (JPG, JPEG, or PNG)' });
        }

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appointment.paymentDetails.screenshot = req.file.path;
        await appointment.save();

        res.json({
            message: 'Payment screenshot uploaded successfully',
            screenshot: req.file.path,
            appointment
        });
    } catch (error) {
        console.error('Error in uploadPaymentScreenshot:', error);
        res.status(500).json({ 
            message: 'Server error during file upload', 
            error: error.message 
        });
    }
};

// @desc    Verify payment for an appointment
// @route   PUT /api/appointments/verify-payment/:id
// @access  Private (Staff/Admin)
exports.verifyPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'verified' or 'rejected'

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be verified or rejected.' });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appointment.paymentDetails.paymentStatus = status;
        appointment.paymentDetails.verifiedBy = req.user._id;
        appointment.paymentDetails.verifiedAt = new Date();

        // If payment is verified, we might also want to auto-approve if staff is reviewing both at once
        // But for now, we keep them separate as per the workflow
        
        await appointment.save();

        // Notify patient
        const patient = await Patient.findById(appointment.patientId).select('userId').lean();
        if (patient?.userId) {
            await Notification.create({
                userId: patient.userId,
                type: 'appointment',
                title: status === 'verified' ? '💰 Payment Verified' : '⚠️ Payment Rejected',
                message: status === 'verified' 
                    ? `Your payment for the appointment on ${appointment.appointmentDate.toLocaleDateString()} has been verified.`
                    : `Your payment was rejected. Please check your transaction details or re-upload the screenshot.`,
                data: { appointmentId: appointment._id }
            });
        }

        res.json({ message: `Payment ${status} successfully`, appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = exports;
