const express = require('express');
const router = express.Router();

const {
    suggestAppointmentSlot,
    analyzeDiseasePatterns,
    balanceDoctorWorkload,
    predictPatientRisk,
    predictPeakHours
} = require('../services/aiService');

const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// ========== Appointment Intelligence ==========
router.post('/appointment-suggestion', suggestAppointmentSlot);

// ========== Disease Analytics ==========
router.get('/disease-patterns', authorize('doctor', 'admin'), analyzeDiseasePatterns);

// ========== Workload Management ==========
router.get('/workload-balancing', authorize('admin'), balanceDoctorWorkload);

// ========== Patient Risk Assessment ==========
router.get('/patient-risk/:patientId', authorize('doctor', 'admin'), predictPatientRisk);

// ========== Resource Planning ==========
router.get('/peak-hours', authorize('admin'), predictPeakHours);

module.exports = router;
