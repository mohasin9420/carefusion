const express = require('express');
const router = express.Router();
const {
    getDailyQueue,
    addToQueue,
    updateQueueStatus,
    getAppointments,
    bookAppointment,
    getPatients,
    getDoctors
} = require('../controllers/staffController');
const { updateDoctorFee } = require('../controllers/adminController');
const { getPatientClinicalSummary } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require staff role
router.use(protect);
router.use(authorize('staff'));

router.get('/queue', getDailyQueue);
router.post('/queue', addToQueue);
router.put('/queue/:id', updateQueueStatus);
router.get('/appointments', getAppointments);
router.post('/appointment', bookAppointment);
router.get('/patients', getPatients);
router.get('/doctors', getDoctors);
router.put('/update-doctor-fee/:id', updateDoctorFee);

// Patient Summary (AI)
router.get('/patient/:id/summary', getPatientClinicalSummary);

module.exports = router;
