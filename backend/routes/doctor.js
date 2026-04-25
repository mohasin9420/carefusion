const express = require('express');
const router = express.Router();
const {
    getAppointments,
    getUpcomingAppointments,
    getPatientEMR,
    createPrescription,
    requestLabTest,
    getWorkloadAnalysis,
    getSmartRecommendations,
    getPatientClinicalSummary
} = require('../controllers/doctorController');

const {
    getQueue,
    callNextPatient,
    updateAppointmentStatus,
    createEmergencySlot
} = require('../controllers/queueController');

const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require doctor role
router.use(protect);
router.use(authorize('doctor'));

// Appointments
router.get('/appointments', getAppointments);
router.get('/appointments/upcoming', getUpcomingAppointments);
router.put('/appointment/:id/status', updateAppointmentStatus);

// Patient EMR
router.get('/patient/:id', getPatientEMR);

// Patient Medical History (new routes for viewing previous records)
router.get('/patient/:patientId/prescriptions', async (req, res) => {
    try {
        const Prescription = require('../models/Prescription');
        const prescriptions = await Prescription.find({ patientId: req.params.patientId })
            .populate('doctorId', 'fullName specialization')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, data: prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/patient/:patientId/lab-tests', async (req, res) => {
    try {
        const LabTest = require('../models/LabTest');
        const labTests = await LabTest.find({ patientId: req.params.patientId })
            .populate('doctorId', 'fullName specialization')
            .sort({ requestedDate: -1 })
            .limit(50);
        res.json({ success: true, data: labTests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/patient/:patientId/full-history', async (req, res) => {
    try {
        const Prescription = require('../models/Prescription');
        const LabTest = require('../models/LabTest');
        const Appointment = require('../models/Appointment');

        const [prescriptions, labTests, appointments] = await Promise.all([
            Prescription.find({ patientId: req.params.patientId })
                .populate('doctorId', 'fullName specialization')
                .sort({ createdAt: -1 })
                .limit(20),
            LabTest.find({ patientId: req.params.patientId })
                .populate('doctorId', 'fullName specialization')
                .sort({ requestedDate: -1 })
                .limit(20),
            Appointment.find({ patientId: req.params.patientId })
                .populate('doctorId', 'fullName specialization')
                .sort({ appointmentDate: -1 })
                .limit(20)
        ]);

        res.json({
            success: true,
            data: {
                prescriptions,
                labTests,
                appointments
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Prescription & Lab
router.post('/prescription', createPrescription);
router.post('/lab-request', requestLabTest);

// Analytics
router.get('/workload', getWorkloadAnalysis);

// Smart Recommendations
router.post('/smart-recommendations', getSmartRecommendations);

// Patient Clinical Summary (AI)
router.get('/patient/:id/summary', authorize('doctor', 'staff'), getPatientClinicalSummary);

// Queue Management
router.get('/queue', getQueue);
router.put('/queue/:id/call', callNextPatient);

// Emergency
router.post('/emergency-slot', createEmergencySlot);

module.exports = router;
