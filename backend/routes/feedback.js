const express = require('express');
const router = express.Router();
const { submitFeedback, getDoctorFeedback, getAllFeedback } = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('patient'), submitFeedback);
router.get('/doctor/:doctorId', protect, authorize('doctor', 'admin'), getDoctorFeedback);
router.get('/', protect, authorize('admin'), getAllFeedback);

module.exports = router;
