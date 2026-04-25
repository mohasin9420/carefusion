const express = require('express');
const router = express.Router();
const labTestController = require('../controllers/labTestController');
const { protect } = require('../middleware/auth');

// @route   GET /api/lab-tests/search
// @desc    Search lab tests (autocomplete)
// @access  Private (Doctor, Staff, Laboratory)
router.get('/search', protect, labTestController.searchLabTests);

// @route   GET /api/lab-tests/categories
// @desc    Get all test categories
// @access  Private
router.get('/categories', protect, labTestController.getCategories);

// @route   GET /api/lab-tests/:id
// @desc    Get lab test details by ID
// @access  Private
router.get('/:id', protect, labTestController.getLabTestById);

// @route   GET /api/lab-tests/name/search
// @desc    Get lab test by exact name
// @access  Private
router.get('/name/search', protect, labTestController.getLabTestByName);

// @route   GET /api/lab-tests
// @desc    Get lab test catalog (paginated)
// @access  Private (Doctor, Laboratory)
router.get('/', protect, labTestController.getLabTestCatalog);

module.exports = router;
