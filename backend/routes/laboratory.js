const express = require('express');
const router = express.Router();

const {
    createLabRequest,
    getLabRequests,
    assignTechnician,
    updateLabStatus,
    uploadLabReport,
    getPatientLabHistory
} = require('../controllers/labRequestController');

const {
    getDailyTestVolume,
    getTurnaroundTimeAnalytics,
    getAbnormalResultsReport,
    getTechnicianPerformance
} = require('../controllers/labAnalyticsController');

const { protect, authorize } = require('../middleware/auth');

// Import laboratory controller for LabTest model operations
const {
    getLabTests,
    updateLabTestStatus,
    uploadReport,
    uploadMiddleware,
    deleteReport,
    resolveDispute
} = require('../controllers/laboratoryController');

const {
    getExpenseSummary,
    getDailyExpenses,
    getMonthlyExpenses,
    getPatientExpenses
} = require('../controllers/labExpenseController');


// ========== Laboratory Dashboard Routes (LabTest model) ==========
// These routes handle lab tests created from doctor prescriptions
router.get('/tests', protect, authorize('laboratory', 'admin'), getLabTests);
router.put('/test/:id', protect, authorize('laboratory', 'admin'), updateLabTestStatus);
router.post('/upload-report/:id', protect, authorize('laboratory', 'admin'), uploadMiddleware, uploadReport);
router.delete('/report/:id', protect, authorize('laboratory', 'admin'), deleteReport);
router.put('/dispute/:id/resolve', protect, authorize('laboratory', 'admin'), resolveDispute);


// ========== Doctor Routes ==========
// Doctors can create lab requests
router.post('/requests', protect, authorize('doctor'), createLabRequest);

// ========== Lab Technician Routes ==========
router.use(protect); // All routes below require authentication

// Request Management
router.get('/requests', authorize('laboratory', 'admin'), getLabRequests);
router.put('/requests/:id/assign', authorize('laboratory', 'admin'), assignTechnician);
router.put('/requests/:id/status', authorize('laboratory', 'admin'), updateLabStatus);
router.post('/requests/:id/report', authorize('laboratory', 'admin'), uploadLabReport);

// Patient History (accessible by doctor and lab)
router.get('/patient/:patientId/history', authorize('doctor', 'laboratory', 'admin'), getPatientLabHistory);

// ========== Analytics Routes ==========
router.get('/analytics/daily-volume', authorize('laboratory', 'admin'), getDailyTestVolume);
router.get('/analytics/turnaround-time', authorize('laboratory', 'admin'), getTurnaroundTimeAnalytics);
router.get('/analytics/abnormal-results', authorize('laboratory', 'admin'), getAbnormalResultsReport);
router.get('/analytics/technician-performance', authorize('laboratory', 'admin'), getTechnicianPerformance);

// ========== Expense Tracking Routes ==========
router.get('/expenses/summary', authorize('laboratory', 'admin'), getExpenseSummary);
router.get('/expenses/daily', authorize('laboratory', 'admin'), getDailyExpenses);
router.get('/expenses/monthly', authorize('laboratory', 'admin'), getMonthlyExpenses);
router.get('/expenses/patients', authorize('laboratory', 'admin'), getPatientExpenses);


module.exports = router;
