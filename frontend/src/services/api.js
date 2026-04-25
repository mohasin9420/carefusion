import axios from 'axios';

// Auto-detect: localhost → use port 5000, production (Render) → same origin
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.protocol}//${window.location.host}/api`;

const api = axios.create({
    baseURL: API_URL,
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle error responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't redirect on 401 for login/register - let the form show the error
        const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
        // Don't redirect on 401 for /auth/me - let AuthContext handle it (avoids flash "unauthorized" on refresh)
        const isGetMe = error.config?.url?.includes('/auth/me');

        if (error.response?.status === 401 && !isAuthRequest && !isGetMe) {
            // Only redirect if we're sure the token is invalid
            // Don't redirect on network errors or server errors (5xx)
            if (error.response?.data?.message?.toLowerCase().includes('token') ||
                error.response?.data?.message?.toLowerCase().includes('invalid') ||
                error.response?.data?.message?.toLowerCase().includes('expired')) {
                console.log('Token invalid, clearing local storage and redirecting to login');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Public API (no authentication required)
export const publicAPI = {
    getDoctors: () => api.get('/public/doctors'),
};

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (data, profileImageFile = null) => {
        // If there's an image file, send as multipart/form-data
        if (profileImageFile) {
            const form = new FormData();
            // Append all JSON fields as a JSON string + the file
            form.append('email', data.email);
            form.append('password', data.password);
            form.append('role', data.role);
            form.append('profileData', JSON.stringify(data.profileData));
            form.append('profilePicture', profileImageFile);
            return api.post('/auth/register', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        return api.post('/auth/register', data);
    },
    getMe: () => api.get('/auth/me'),
    verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
    resendOtp: (email) => api.post('/auth/resend-otp', { email }),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// Patient API
export const patientAPI = {
    getAppointments: () => api.get('/patient/appointments'),
    bookAppointment: (data) => api.post('/patient/appointments', data),
    getPrescriptions: () => api.get('/patient/prescriptions'),
    downloadPrescriptionPDF: (id) => api.get(`/patient/prescriptions/${id}/download`, { responseType: 'blob' }),
    getLabReports: () => api.get('/patient/lab-reports'),
    getProfile: () => api.get('/patient/profile'),
    updateProfile: (data) => api.put('/patient/profile', data),
    // Family Members
    getFamilyMembers: () => api.get('/patient/family'),
    addFamilyMember: (data) => api.post('/patient/family', data),
    updateFamilyMember: (id, data) => api.put(`/patient/family/${id}`, data),
    deleteFamilyMember: (id) => api.delete(`/patient/family/${id}`),
    // Lab Report Disputes
    raiseLabDispute: (id, message) => api.post(`/patient/lab-reports/${id}/dispute`, { message }),
};


// Doctor API
export const doctorAPI = {
    getAppointments: (date) => api.get('/doctor/appointments', { params: { date } }),
    getUpcomingAppointments: (days = 7) => api.get('/doctor/appointments/upcoming', { params: { days } }),
    getPatientEMR: (id, memberId) => api.get(`/doctor/patient/${id}`, { params: memberId !== undefined ? { memberId: memberId ?? 'null' } : {} }),
    createPrescription: (data) => api.post('/doctor/prescription', data),
    requestLabTest: (data) => api.post('/doctor/lab-request', data),
    getPatientClinicalSummary: (id, memberId) => api.get(`/doctor/patient/${id}/summary`, { params: { memberId } }),
};

// Staff API
export const staffAPI = {
    getDailyQueue: (date) => api.get('/staff/queue', { params: { date } }),
    addToQueue: (data) => api.post('/staff/queue', data),
    updateQueueStatus: (id, status) => api.put(`/staff/queue/${id}`, { status }),
    getAppointments: (date) => api.get('/staff/appointments', { params: { date } }),
    bookAppointment: (data) => api.post('/staff/appointment', data),
    getPatients: () => api.get('/staff/patients'),
    getDoctors: () => api.get('/staff/doctors'),
    getPatientClinicalSummary: (id, memberId) => api.get(`/staff/patient/${id}/summary`, { params: { memberId } }),
    updateDoctorFee: (id, data) => api.put(`/staff/update-doctor-fee/${id}`, data),
};

// Pharmacy API
export const pharmacyAPI = {
    getPrescriptions: (status) => api.get('/pharmacy/prescriptions', { params: status ? { status } : {} }),
    updatePrescriptionStatus: (id, status) => api.put(`/pharmacy/prescriptions/${id}/status`, { status }),
    dispensePrescription: (id) => api.put(`/pharmacy/dispense/${id}`),
    getInventory: () => api.get('/pharmacy/inventory'),
    addMedicine: (data) => api.post('/pharmacy/inventory', data),
    updateInventory: (id, data) => api.put(`/pharmacy/inventory/${id}`, data),
    getSalesReport: (startDate, endDate) => api.get('/pharmacy/sales-report', { params: startDate && endDate ? { startDate, endDate } : {} }),
};

// Laboratory API
export const laboratoryAPI = {
    getLabTests: (status) => api.get('/laboratory/tests', { params: { status } }),
    updateLabTestStatus: (id, data) => api.put(`/laboratory/test/${id}`, data),
    // Upload or replace a report (with optional payment amount)
    uploadReport: (id, file, paymentAmount) => {
        const formData = new FormData();
        formData.append('report', file);
        if (paymentAmount !== undefined && paymentAmount !== '') {
            formData.append('paymentAmount', paymentAmount);
        }
        return api.post(`/laboratory/upload-report/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    // Delete a report
    deleteReport: (id) => api.delete(`/laboratory/report/${id}`),
    // Resolve a patient dispute
    resolveDispute: (id, resolutionNote) => api.put(`/laboratory/dispute/${id}/resolve`, { resolutionNote }),
    // Expense Tracker
    getExpenseSummary: () => api.get('/laboratory/expenses/summary'),
    getDailyExpenses: (month) => api.get('/laboratory/expenses/daily', { params: month ? { month } : {} }),
    getMonthlyExpenses: () => api.get('/laboratory/expenses/monthly'),
    getPatientExpenses: (month) => api.get('/laboratory/expenses/patients', { params: month ? { month } : {} }),
};



// Admin API
export const adminAPI = {
    getPendingUsers: () => api.get('/admin/pending-users'),
    approveUser: (id, status) => api.put(`/admin/approve-user/${id}`, { status }),
    createUser: (data) => api.post('/admin/create-user', data),
    getAnalytics: () => api.get('/admin/analytics'),
    getUsersByRole: (role) => api.get(`/admin/users/${role}`),
    getUserCounts: () => api.get('/admin/user-counts'),
    getUserDetails: (id) => api.get(`/admin/user/${id}`),
    blockUser: (id) => api.put(`/admin/block-user/${id}`),
    deleteUser: (id) => api.delete(`/admin/delete-user/${id}`),
    // Email Config
    getEmailConfig: () => api.get('/admin/config/email'),
    updateEmailConfig: (data) => api.put('/admin/config/email', data),
    testEmailConfig: (data) => api.post('/admin/config/email/test', data),
    // API Key Management
    getApiKeys: () => api.get('/admin/config/api-keys'),
    addApiKey: (data) => api.post('/admin/config/api-keys', data),
    updateApiKey: (keyId, data) => api.put(`/admin/config/api-keys/${keyId}`, data),
    deleteApiKey: (keyId) => api.delete(`/admin/config/api-keys/${keyId}`),
    testApiKey: (keyId) => api.post(`/admin/config/api-keys/${keyId}/test`),
    updateDoctorFee: (id, data) => api.put(`/admin/update-doctor-fee/${id}`, data),
    updatePaymentConfig: (data) => api.put('/admin/config/payment', data),
};

// Availability API (Doctor Schedule Management)
export const availabilityAPI = {
    setDoctorAvailability: (data) => api.post('/availability/set-schedule', data),
    getDoctorAvailability: (doctorId) => api.get(`/availability/doctor/${doctorId}`),
    getAvailableSlots: (doctorId, date) => api.get('/availability/slots', { params: { doctorId, date } }),
    getAISuggestedSlots: (doctorId, date) => api.get('/availability/ai-slots', { params: { doctorId, date } }),
    blockSlots: (data) => api.post('/availability/block-slots', data),
    unblockSlots: (id) => api.delete(`/availability/block-slots/${id}`),
    getBlockedSlots: (doctorId) => api.get(`/availability/blocked-slots/${doctorId}`),
    getAllDoctorsAvailability: () => api.get('/availability/all-doctors'),
    // Doctor self-service: manage own availability
    blockMySlots: (data) => api.post('/availability/my-block', data),
    getMyBlockedSlots: () => api.get('/availability/my-blocked-slots'),
    unblockMySlot: (id) => api.delete(`/availability/my-blocked-slots/${id}`),
};

// Feedback API
export const feedbackAPI = {
    submitFeedback: (data) => api.post('/feedback', data),
};

// Appointment API
export const appointmentAPI = {
    bookAppointment: (data) => api.post('/appointments/book', data),
    getMyAppointments: (patientId) => api.get('/appointments/my-appointments', { params: { patientId } }),
    getDoctorSchedule: (doctorId, date) => api.get('/appointments/doctor-schedule', { params: { doctorId, date } }),
    cancelAppointment: (id) => api.put(`/appointments/cancel/${id}`),
    rescheduleAppointment: (id, data) => api.put(`/appointments/reschedule/${id}`, data),
    getPostponeCharge: (id) => api.get(`/appointments/postpone-charge/${id}`),
    emergencyShift: (data) => api.post('/appointments/emergency-shift', data),
    updateAppointmentStatus: (id, status) => api.put(`/appointments/status/${id}`, { status }),
    getAllAppointments: (params) => api.get('/appointments/all', { params }),
    // Staff review workflow
    getPendingReviews: () => api.get('/appointments/pending-reviews'),
    reviewAppointment: (id, data) => api.put(`/appointments/review/${id}`, data),
    staffBookAppointment: (data) => api.post('/appointments/staff-book', data),
    getSmartRecommendations: (data) => api.post('/doctor/smart-recommendations', data),
    uploadPaymentScreenshot: (id, formData) => api.post(`/appointments/upload-screenshot/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    verifyPayment: (id, data) => api.put(`/appointments/verify-payment/${id}`, data),
};

// Diagnostic Test API
export const diagnosticTestAPI = {
    searchTests: (query, limit = 10) => api.get(`/lab-tests/search`, { params: { q: query, limit } }),
    getAllTests: (page = 1, limit = 20, category = '') => api.get('/lab-tests', { params: { page, limit, category } }),
    getCategories: () => api.get('/lab-tests/categories'),
    getTestById: (id) => api.get(`/lab-tests/${id}`),
};

// Insurance Claim API
export const insuranceAPI = {
    generateCodes: (data) => api.post('/insurance/generate-codes', data),
    generateNarrative: (data) => api.post('/insurance/generate-narrative', data),
    analyzeReport: (reportText) => api.post('/insurance/analyze-report', { reportText }),
    saveClaim: (data) => api.post('/insurance/claims', data),
    updateClaimStatus: (id, data) => api.put(`/insurance/claims/${id}/status`, data),
    getClaimById: (id) => api.get(`/insurance/claims/${id}`),
    getClaimFile: (id) => api.get(`/insurance/claims/${id}/file`),
    getPatientClaims: (patientId) => api.get(`/insurance/patient/${patientId}`),
    getPatientPrescriptions: (patientId, memberId) => api.get(`/insurance/patient/${patientId}/prescriptions`, { params: { memberId } }),
    getDoctorClaims: () => api.get('/insurance/doctor/claims'),
    getAllClaims: (params) => api.get('/insurance/admin/all', { params }),
    // PDF Downloads (returns blob)
    downloadMedicalFilePDF: (prescriptionId) => api.get(`/insurance/prescription/${prescriptionId}/medical-file-pdf`, { responseType: 'blob' }),
    downloadInsuranceClaimPDF: (claimId) => api.get(`/insurance/claims/${claimId}/pdf`, { responseType: 'blob' }),
};

export default api;
