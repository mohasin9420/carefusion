const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    generateClaimCodes,
    generateClaimNarrative,
    analyzeReport,
    saveClaim,
    updateClaimStatus,
    getAllClaims,
    generateClaimFile,
    getPatientClaims,
    getPatientPrescriptions,
    getDoctorClaims,
    getClaimById,
    downloadMedicalFilePDF,
    downloadInsuranceClaimPDF
} = require('../controllers/insuranceController');

// AI-powered generation (doctors + staff)
router.post('/generate-codes', protect, authorize('doctor', 'staff', 'admin'), generateClaimCodes);
router.post('/generate-narrative', protect, authorize('doctor', 'staff', 'admin'), generateClaimNarrative);
router.post('/analyze-report', protect, authorize('doctor', 'staff', 'admin'), analyzeReport);

// Claim CRUD
router.post('/claims', protect, authorize('doctor', 'staff', 'admin'), saveClaim);
router.get('/claims/:id', protect, getClaimById);
router.put('/claims/:id/status', protect, authorize('doctor', 'staff', 'admin'), updateClaimStatus);
router.get('/claims/:id/file', protect, authorize('doctor', 'staff', 'admin'), generateClaimFile);

// PDF Downloads
router.get('/claims/:id/pdf', protect, downloadInsuranceClaimPDF);
router.get('/prescription/:prescriptionId/medical-file-pdf', protect, downloadMedicalFilePDF);

// Staff / Admin dashboard — all claims
router.get('/admin/all', protect, authorize('staff', 'admin'), getAllClaims);

// Patient's claim history (accessible to patient, doctor, staff)
router.get('/patient/:patientId', protect, getPatientClaims);

// Patient prescriptions for claim selection (doctor + staff)
router.get('/patient/:patientId/prescriptions', protect, authorize('doctor', 'staff', 'admin'), getPatientPrescriptions);

// Doctor's filed claims
router.get('/doctor/claims', protect, authorize('doctor'), getDoctorClaims);

module.exports = router;
