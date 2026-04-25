const express = require('express');
const router = express.Router();
const {
    bookAppointment,
    getMyAppointments,
    getDoctorSchedule,
    cancelAppointment,
    updateAppointmentStatus,
    getAllAppointments,
    rescheduleAppointment,
    getPostponeCharge,
    bulkEmergencyShift,
    getPendingReviews,
    reviewAppointment,
    staffBookAppointment,
    verifyPayment,
    uploadPaymentScreenshot
} = require('../controllers/appointmentController');
const paymentUpload = require('../middleware/paymentUpload');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Book appointment (patient or staff)
router.post('/book', bookAppointment);

// Get patient's appointments
router.get('/my-appointments', getMyAppointments);

// Get doctor's schedule
router.get('/doctor-schedule', authorize('doctor', 'staff', 'admin'), getDoctorSchedule);

// Cancel appointment
router.put('/cancel/:id', cancelAppointment);

// Reschedule appointment (enhanced with postpone charge)
router.put('/reschedule/:id', rescheduleAppointment);

// Get default postpone charge for an appointment
router.get('/postpone-charge/:id', getPostponeCharge);

// Bulk emergency shift – move all scheduled appts for a doctor on a day
router.post('/emergency-shift', authorize('staff', 'admin'), bulkEmergencyShift);

// Update appointment status (doctor or staff)
router.put('/status/:id', authorize('doctor', 'staff', 'admin'), updateAppointmentStatus);

// Get all appointments (admin/staff)
router.get('/all', authorize('staff', 'admin'), getAllAppointments);

// ── Staff review workflow ────────────────────────────────────────────────────
// Get all pending-review appointments
router.get('/pending-reviews', authorize('staff', 'admin'), getPendingReviews);

// Staff approves/rejects + adds initial diagnosis
router.put('/review/:id', authorize('staff', 'admin'), reviewAppointment);

// Staff books an appointment on behalf of a patient (walk-in counter)
router.post('/staff-book', authorize('staff', 'admin'), staffBookAppointment);

// ── Payment Verification Workflow ──────────────────────────────────────────
// Staff verifies payment
router.put('/verify-payment/:id', authorize('staff', 'admin'), verifyPayment);

// Patient uploads screenshot
router.post('/upload-screenshot/:id', paymentUpload, uploadPaymentScreenshot);

module.exports = router;

