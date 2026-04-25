const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const Bill = require('../models/Bill');
const Pharmacy = require('../models/Pharmacy');
const PharmacyStock = require('../models/PharmacyStock');
const MedicineCatalog = require('../models/MedicineCatalog');
const qrCodeService = require('../services/qrCodeService');

// @desc    Verify prescription QR code
// @route   POST /api/pharmacy/prescriptions/verify-qr
// @access  Private/Pharmacy
exports.verifyPrescriptionQR = async (req, res) => {
    try {
        const { qrData } = req.body;

        if (!qrData) {
            return res.status(400).json({ message: 'QR data is required' });
        }

        // Verify QR code
        const prescriptionData = qrCodeService.verifyPrescriptionQR(qrData);

        // Find prescription
        const prescription = await Prescription.findOne({
            prescriptionId: prescriptionData.prescriptionId,
            verificationCode: prescriptionData.verificationCode
        })
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization');

        if (!prescription) {
            return res.status(404).json({ message: 'Invalid or expired prescription' });
        }

        res.json({
            message: 'Prescription verified successfully',
            prescription
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Invalid QR code' });
    }
};

// @desc    Update prescription dispensing status
// @route   PUT /api/pharmacy/prescriptions/:id/status
// @access  Private/Pharmacy
exports.updatePrescriptionStatus = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ userId: req.user._id });
        const { status, notes } = req.body;

        const prescription = await Prescription.findById(req.params.id);

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        prescription.status = status;
        if (notes) prescription.pharmacyNotes = notes;
        if (pharmacy) prescription.dispensedBy = pharmacy._id;

        await prescription.save();

        res.json({
            message: 'Prescription status updated',
            prescription
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get low stock medicines
// @route   GET /api/pharmacy/inventory/low-stock
// @access  Private/Pharmacy
exports.getLowStockMedicines = async (req, res) => {
    try {
        const lowStockMedicines = await Medicine.find({
            $expr: { $lte: ['$quantity', '$minQuantity'] }
        }).sort({ quantity: 1 });

        res.json(lowStockMedicines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get medicines expiring soon
// @route   GET /api/pharmacy/inventory/expiring-soon
// @access  Private/Pharmacy
exports.getExpiringMedicines = async (req, res) => {
    try {
        const { days = 90 } = req.query;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(days));

        const expiringMedicines = await Medicine.find({
            'batches.expiryDate': { $lte: expiryDate, $gte: new Date() }
        }).sort({ 'batches.expiryDate': 1 });

        res.json(expiringMedicines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Recall medicine batch
// @route   PUT /api/pharmacy/inventory/recall/:id/batch/:batchNumber
// @access  Private/Pharmacy
exports.recallMedicineBatch = async (req, res) => {
    try {
        const { id, batchNumber } = req.params;
        const { reason } = req.body;

        const medicine = await Medicine.findById(id);

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        const batch = medicine.batches.find(b => b.batchNumber === batchNumber);

        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        batch.isRecalled = true;
        batch.recallReason = reason;
        batch.recalledAt = new Date();

        await medicine.save();

        res.json({
            message: 'Batch recalled successfully',
            medicine
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Search medicine by barcode
// @route   GET /api/pharmacy/inventory/barcode/:barcode
// @access  Private/Pharmacy
exports.searchByBarcode = async (req, res) => {
    try {
        const medicine = await Medicine.findOne({ barcode: req.params.barcode })
            .populate('supplier', 'name company');

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        res.json(medicine);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== INVENTORY MANAGEMENT ====================

// @desc    Get pharmacy inventory
// @route   GET /api/pharmacy/inventory
// @access  Private/Pharmacy
exports.getInventory = async (req, res) => {
    try {
        const inventory = await PharmacyStock.find({})
            .populate('medicineId', 'name manufacturer saltComposition price')
            .sort({ name: 1 });

        res.json(inventory);
    } catch (error) {
        console.error('❌ GET INVENTORY ERROR:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add medicine to inventory
// @route   POST /api/pharmacy/inventory
// @access  Private/Pharmacy
exports.addMedicineToInventory = async (req, res) => {
    try {
        const { name, genericName, quantity, minQuantity, unit, category } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Medicine name is required' });
        }

        // Check if medicine exists in catalog
        let medicineId = null;
        const catalogMedicine = await MedicineCatalog.findOne({
            name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        if (catalogMedicine) {
            medicineId = catalogMedicine._id;
        }

        // Create stock entry
        const stock = await PharmacyStock.create({
            medicineId,
            name,
            genericName,
            quantity: quantity || 0,
            minQuantity: minQuantity || 10,
            unit: unit || 'strip',
            category: category || 'tablet',
            lastRestocked: new Date()
        });

        res.status(201).json({
            message: 'Medicine added to inventory',
            stock
        });
    } catch (error) {
        console.error('❌ ADD MEDICINE ERROR:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update medicine stock
// @route   PUT /api/pharmacy/inventory/:id
// @access  Private/Pharmacy
exports.updateInventory = async (req, res) => {
    try {
        const { quantity, minQuantity } = req.body;

        const stock = await PharmacyStock.findById(req.params.id);

        if (!stock) {
            return res.status(404).json({ message: 'Medicine not found in inventory' });
        }

        if (quantity !== undefined) {
            stock.quantity = quantity;
            stock.lastRestocked = new Date();
        }

        if (minQuantity !== undefined) {
            stock.minQuantity = minQuantity;
        }

        await stock.save();

        res.json({
            message: 'Inventory updated',
            stock
        });
    } catch (error) {
        console.error('❌ UPDATE INVENTORY ERROR:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};