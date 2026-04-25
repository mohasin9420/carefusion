const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const { verifyClaim } = require('../controllers/insuranceController');

// @desc    Get all doctors (public - for homepage)
// @route   GET /api/public/doctors
// @access  Public
router.get('/doctors', async (req, res) => {
    try {
        // Get ALL doctors (removed isActive filter)
        const doctors = await Doctor.find({})
            .populate('userId', 'fullName email')
            .select('fullName specialization experience qualification profilePicture consultationFee contactNumber department')
            .sort({ createdAt: -1 });

        console.log(`📋 Public API: Found ${doctors.length} doctors`);
        res.json(doctors);
    } catch (error) {
        console.error('❌ Error fetching doctors:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Verify an insurance claim (public lookup)
// @route   GET /api/public/verify-claim/:ref
// @access  Public
router.get('/verify-claim/:ref', verifyClaim);

module.exports = router;
