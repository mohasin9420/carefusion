const express = require('express');
const router = express.Router();

// Import controller
const {
    searchTests,
    getAllTests,
    createTest,
    updateTest,
    deleteTest,
    getTestById
} = require('../controllers/diagnosticTestController');

const { protect, authorize } = require('../middleware/auth');

// All routes protected
router.use(protect);

// @route   GET /api/diagnostic-tests/search
router.get('/search', searchTests);

// @route   POST /api/diagnostic-tests
// @access  Private (Admin, Staff, Laboratory)
router.post('/', authorize('admin', 'staff', 'laboratory'), createTest);

// @route   GET /api/diagnostic-tests/:id
router.get('/:id', getTestById);

// @route   PUT /api/diagnostic-tests/:id
// @access  Private (Admin, Staff, Laboratory)
router.put('/:id', authorize('admin', 'staff', 'laboratory'), updateTest);

// @route   DELETE /api/diagnostic-tests/:id
// @access  Private (Admin)
router.delete('/:id', authorize('admin'), deleteTest);

// @route   GET /api/diagnostic-tests
router.get('/', getAllTests);

module.exports = router;
