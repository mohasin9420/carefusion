const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');

// @desc    Create purchase order
// @route   POST /api/pharmacy/purchase-orders
// @access  Private/Pharmacy
exports.createPurchaseOrder = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ userId: req.user._id });
        const { supplierId, items, expectedDeliveryDate, notes } = req.body;

        if (!supplierId || !items || items.length === 0) {
            return res.status(400).json({ message: 'Supplier and items are required' });
        }

        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        // Create purchase order (totals calculated in pre-save hook)
        const purchaseOrder = await PurchaseOrder.create({
            supplierId,
            pharmacyId: pharmacy._id,
            items,
            subtotal: 0, // Will be calculated
            gstAmount: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * 0.12), 0),
            totalAmount: 0, // Will be calculated
            expectedDeliveryDate,
            notes,
            createdBy: req.user._id
        });

        // Update supplier stats
        supplier.totalOrders += 1;
        await supplier.save();

        await purchaseOrder.populate('supplierId', 'name company contactPerson');

        res.status(201).json({
            message: 'Purchase order created successfully',
            purchaseOrder
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all purchase orders
// @route   GET /api/pharmacy/purchase-orders
// @access  Private/Pharmacy
exports.getPurchaseOrders = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ userId: req.user._id });
        const { status } = req.query;

        const query = { pharmacyId: pharmacy._id };
        if (status) query.status = status;

        const purchaseOrders = await PurchaseOrder.find(query)
            .populate('supplierId', 'name company contactPerson')
            .sort({ createdAt: -1 });

        res.json(purchaseOrders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update purchase order status
// @route   PUT /api/pharmacy/purchase-orders/:id/status
// @access  Private/Pharmacy
exports.updatePurchaseOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['draft', 'sent', 'confirmed', 'received', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const purchaseOrder = await PurchaseOrder.findById(req.params.id);

        if (!purchaseOrder) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        purchaseOrder.status = status;

        if (status === 'received') {
            purchaseOrder.actualDeliveryDate = new Date();
            purchaseOrder.receivedBy = req.user._id;

            // Update medicine stock
            for (const item of purchaseOrder.items) {
                const medicine = await Medicine.findById(item.medicineId);
                if (medicine) {
                    // Add to main quantity
                    medicine.quantity += item.quantity;

                    // Add batch information
                    if (!medicine.batches) medicine.batches = [];
                    medicine.batches.push({
                        batchNumber: item.batchNumber,
                        quantity: item.quantity,
                        expiryDate: item.expiryDate,
                        manufacturingDate: new Date(),
                        purchasePrice: item.unitPrice,
                        mrp: item.unitPrice * 1.3 // 30% markup
                    });

                    medicine.lastRestocked = new Date();
                    await medicine.save();
                }
            }

            // Update supplier stats
            const supplier = await Supplier.findById(purchaseOrder.supplierId);
            if (supplier) {
                supplier.totalPurchaseValue += purchaseOrder.totalAmount;
                await supplier.save();
            }
        }

        await purchaseOrder.save();

        res.json({
            message: `Purchase order marked as ${status}`,
            purchaseOrder
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create supplier
// @route   POST /api/pharmacy/suppliers
// @access  Private/Pharmacy
exports.createSupplier = async (req, res) => {
    try {
        const { name, company, email, phone, address, gstNumber, paymentTerms } = req.body;

        if (!name || !company || !email || !phone) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const supplier = await Supplier.create({
            name,
            company,
            email,
            phone,
            address,
            gstNumber,
            paymentTerms
        });

        res.status(201).json({
            message: 'Supplier created successfully',
            supplier
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all suppliers
// @route   GET /api/pharmacy/suppliers
// @access  Private/Pharmacy
exports.getSuppliers = async (req, res) => {
    try {
        const { status } = req.query;

        const query = status ? { status } : {};

        const suppliers = await Supplier.find(query).sort({ name: 1 });

        res.json(suppliers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update supplier
// @route   PUT /api/pharmacy/suppliers/:id
// @access  Private/Pharmacy
exports.updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        res.json({
            message: 'Supplier updated successfully',
            supplier
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// All functions already exported via exports.functionName above