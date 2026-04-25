const express = require('express');
const router = express.Router();

const {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    approveUser,
    blockUser,
    changeUserRole
} = require('../controllers/adminUserController');

const {
    getPendingUsers,
    approveUser: approveUserSimple,
    createUser: createUserWithProfile,
    getAnalytics,
    getUsersByRole,
    getUserCounts,
    getUserDetails,
    blockUser: toggleBlockUser,
    deleteUser: deleteUserWithProfile,
    updateDoctorFee,
    updatePaymentConfig
} = require('../controllers/adminController');

const {
    createDepartment,
    getDepartments,
    updateDepartment,
    assignDoctorToDepartment,
    assignStaffToDepartment,
    getDepartmentPerformance
} = require('../controllers/adminDepartmentController');

const {
    getDashboardOverview,
    getAppointmentStatistics,
    getRevenueByDepartment,
    getDoctorPerformance,
    getPatientGrowth,
    getSystemHealth
} = require('../controllers/adminAnalyticsController');

const {
    getAuditLogs,
    getSecurityAlerts,
    getLoginTracking,
    getHospitalConfig,
    updateHospitalConfig
} = require('../controllers/adminAuditController');

const {
    getEmailConfig,
    updateEmailConfig,
    testEmailConfig
} = require('../controllers/adminEmailController');

const {
    getApiKeys,
    addApiKey,
    updateApiKey,
    deleteApiKey,
    testApiKey
} = require('../controllers/adminApiKeyController');

const { protect, authorize } = require('../middleware/auth');

// All routes require admin authorization
router.use(protect);
router.use((req, res, next) => {
    console.log(`🔍 Admin route accessed: ${req.method} ${req.originalUrl}`);
    next();
});
router.use(authorize('admin'));

// ========== User Management ==========
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/approve', approveUser);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/role', changeUserRole);

// ========== Approval Management (from adminController.js) ==========
router.get('/pending-users', getPendingUsers);
router.put('/approve-user/:id', approveUserSimple);
router.post('/create-user', createUserWithProfile);
router.get('/analytics', getAnalytics);
router.get('/users/:role', getUsersByRole);
router.get('/user-counts', getUserCounts);
router.get('/user/:id', getUserDetails);
router.put('/block-user/:id', toggleBlockUser);
router.delete('/delete-user/:id', deleteUserWithProfile);
router.put('/update-doctor-fee/:id', updateDoctorFee);
router.put('/config/payment', updatePaymentConfig);

// ========== Department Management ==========
router.post('/departments', createDepartment);
router.get('/departments', getDepartments);
router.put('/departments/:id', updateDepartment);
router.put('/departments/:id/assign-doctor', assignDoctorToDepartment);
router.put('/departments/:id/assign-staff', assignStaffToDepartment);
router.get('/departments/:id/performance', getDepartmentPerformance);

// ========== Analytics Dashboard ==========
router.get('/analytics/dashboard', getDashboardOverview);
router.get('/analytics/appointments', getAppointmentStatistics);
router.get('/analytics/revenue-by-department', getRevenueByDepartment);
router.get('/analytics/doctor-performance', getDoctorPerformance);
router.get('/analytics/patient-growth', getPatientGrowth);
router.get('/analytics/system-health', getSystemHealth);

// ========== Audit Logs ==========
router.get('/audit-logs', getAuditLogs);
router.get('/audit-logs/security-alerts', getSecurityAlerts);
router.get('/audit-logs/login-tracking', getLoginTracking);

// ========== Hospital Configuration ==========
router.get('/config', getHospitalConfig);
router.put('/config', updateHospitalConfig);

// ========== Email Configuration ==========
router.get('/config/email', getEmailConfig);
router.put('/config/email', updateEmailConfig);
router.post('/config/email/test', testEmailConfig);

// ========== API Key Management ==========
router.get('/config/api-keys', getApiKeys);
router.post('/config/api-keys', addApiKey);
router.put('/config/api-keys/:keyId', updateApiKey);
router.delete('/config/api-keys/:keyId', deleteApiKey);
router.post('/config/api-keys/:keyId/test', testApiKey);

module.exports = router;
