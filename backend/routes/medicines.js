const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const medicineCatalogController = require('../controllers/medicineCatalogController');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/medicines/search
// @desc    Search medicines (autocomplete)
// @access  Private (Doctor, Staff, Pharmacy)
router.get('/search', protect, medicineController.searchMedicines);

// @route   GET /api/medicines/all
// @desc    Get all medicines (paginated with filters)
// @access  Private (Admin, Pharmacy, Laboratory)
router.get('/all', protect, authorize('admin', 'pharmacy', 'laboratory'), medicineCatalogController.getAllMedicines);

// @route   POST /api/medicines
// @desc    Create new medicine in catalog
// @access  Private (Admin, Pharmacy, Laboratory)
router.post('/', protect, authorize('admin', 'pharmacy', 'laboratory'), medicineCatalogController.createMedicine);

// @route   PUT /api/medicines/:id
// @desc    Update medicine in catalog
// @access  Private (Admin, Pharmacy)
router.put('/:id', protect, authorize('admin', 'pharmacy'), medicineCatalogController.updateMedicine);

// @route   DELETE /api/medicines/:id
// @desc    Mark medicine as discontinued
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), medicineCatalogController.discontinueMedicine);

// @route   GET /api/medicines/:id
// @desc    Get medicine details by ID
// @access  Private (Doctor, Staff, Pharmacy)
router.get('/:id', protect, medicineController.getMedicineById);

// @route   GET /api/medicines/name/search
// @desc    Get medicine by exact name
// @access  Private
router.get('/name/search', protect, medicineController.getMedicineByName);

// @route   GET /api/medicines
// @desc    Get medicine catalog (paginated)
// @access  Private (Doctor, Pharmacy)
router.get('/', protect, medicineController.getMedicineCatalog);

module.exports = router;
