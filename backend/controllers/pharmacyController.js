const Prescription = require('../models/Prescription');
const Pharmacy = require('../models/Pharmacy');
const Medicine = require('../models/Medicine');

// @desc    Get prescriptions (filter by status: pending, ready, out_of_stock, dispensed)
// @route   GET /api/pharmacy/prescriptions
// @access  Private/Pharmacy
exports.getPrescriptions = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : { status: { $in: ['pending', 'ready', 'out_of_stock'] } };

        const prescriptions = await Prescription.find(query)
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization')
            .sort({ createdAt: -1 });

        res.json(prescriptions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update prescription status (ready / out_of_stock)
// @route   PUT /api/pharmacy/prescription/:id/status
// @access  Private/Pharmacy
exports.updatePrescriptionStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'ready' or 'out_of_stock'

        if (!['ready', 'out_of_stock'].includes(status)) {
            return res.status(400).json({ message: 'Status must be ready or out_of_stock' });
        }

        const prescription = await Prescription.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        )
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization');

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        res.json(prescription);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Dispense prescription
// @route   PUT /api/pharmacy/dispense/:id
// @access  Private/Pharmacy
exports.dispensePrescription = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ userId: req.user._id });

        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy profile not found' });
        }

        const prescription = await Prescription.findByIdAndUpdate(
            req.params.id,
            {
                status: 'dispensed',
                dispensedBy: pharmacy._id,
                dispensedAt: new Date()
            },
            { new: true }
        )
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization');

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        res.json(prescription);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add medicine to inventory
// @route   POST /api/pharmacy/inventory
// @access  Private/Pharmacy
exports.addMedicine = async (req, res) => {
    try {
        const { name, genericName, category, quantity, minQuantity, unit, pricePerUnit } = req.body;
        const medicine = await Medicine.create({
            name,
            genericName,
            category,
            quantity: quantity || 0,
            minQuantity: minQuantity || 10,
            unit: unit || 'strip',
            pricePerUnit
        });
        res.status(201).json(medicine);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get medicine inventory
// @route   GET /api/pharmacy/inventory
// @access  Private/Pharmacy
exports.getInventory = async (req, res) => {
    try {
        const medicines = await Medicine.find().sort({ name: 1 });
        res.json(medicines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update medicine stock
// @route   PUT /api/pharmacy/inventory/:id
// @access  Private/Pharmacy
exports.updateInventory = async (req, res) => {
    try {
        const { quantity, status } = req.body;
        const update = {};
        if (quantity !== undefined) update.quantity = quantity;
        if (status) update.status = status; // 'in_stock' | 'low_stock' | 'out_of_stock'

        const medicine = await Medicine.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
        res.json(medicine);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get sales/dispensing report
// @route   GET /api/pharmacy/sales-report
// @access  Private/Pharmacy
exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { status: 'dispensed' };
        if (startDate && endDate) {
            query.dispensedAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const dispensed = await Prescription.find(query)
            .populate('patientId', 'fullName')
            .populate('doctorId', 'fullName')
            .sort({ dispensedAt: -1 });

        const summary = {
            totalDispensed: dispensed.length,
            period: startDate && endDate ? { startDate, endDate } : 'all'
        };

        res.json({ summary, prescriptions: dispensed });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
