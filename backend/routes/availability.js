const express = require('express');
const router = express.Router();
const {
    setDoctorAvailability,
    getDoctorAvailability,
    getAvailableSlots,
    getAISuggestedSlots,
    blockSlots,
    unblockSlots,
    getBlockedSlots,
    getAllDoctorsAvailability,
    blockMySlots,
    getMyBlockedSlots,
    unblockMySlot
} = require('../controllers/availabilityController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Set doctor availability (staff only)
router.post('/set-schedule', authorize('staff', 'admin'), setDoctorAvailability);

// Get doctor's availability
router.get('/doctor/:doctorId', getDoctorAvailability);

// Get available slots for booking
router.get('/slots', getAvailableSlots);
// Get AI-suggested slots (prioritizes less crowded times)
router.get('/ai-slots', getAISuggestedSlots);

// Block specific slots (staff only)
router.post('/block-slots', authorize('staff', 'admin'), blockSlots);

// Unblock slots (staff only)
router.delete('/block-slots/:id', authorize('staff', 'admin'), unblockSlots);

// Get blocked slots for a doctor (staff only)
router.get('/blocked-slots/:doctorId', authorize('staff', 'admin'), getBlockedSlots);

// Get all doctors with availability status (accessible to all authenticated users)
router.get('/all-doctors', getAllDoctorsAvailability);

// Doctor: manage own availability (full-day leave, partial block, emergency)
router.post('/my-block', authorize('doctor'), blockMySlots);
router.get('/my-blocked-slots', authorize('doctor'), getMyBlockedSlots);
router.delete('/my-blocked-slots/:id', authorize('doctor'), unblockMySlot);

module.exports = router;
