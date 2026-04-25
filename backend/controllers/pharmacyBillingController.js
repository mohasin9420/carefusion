const Bill = require('../models/Bill');
const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Pharmacy = require('../models/Pharmacy');

// @desc    Generate bill for prescription
// @route   POST /api/pharmacy/billing/generate
// @access  Private/Pharmacy
exports.generateBill = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ userId: req.user._id });
        const { prescriptionId, patientId, items, paymentMethod, discount = 0 } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Items are required' });
        }

        // Process each item and calculate prices
        const processedItems = [];

        for (const item of items) {
            const medicine = await Medicine.findById(item.medicineId);

            if (!medicine) {
                return res.status(404).json({ message: `Medicine ${item.medicineName} not found` });
            }

            // Check stock availability
            if (medicine.quantity < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${medicine.name}. Available: ${medicine.quantity}`
                });
            }

            processedItems.push({
                medicineId: medicine._id,
                medicineName: medicine.name,
                batchNumber: item.batchNumber || medicine.batches[0]?.batchNumber,
                quantity: item.quantity,
                unitPrice: item.unitPrice || medicine.pricePerUnit,
                discount: item.discount || 0,
                gstRate: 12 // 12% GST for medicines
            });

            // Update medicine stock
            medicine.quantity -= item.quantity;
            medicine.totalSold += item.quantity;
            await medicine.save();
        }

        // Create bill
        const bill = await Bill.create({
            prescriptionId,
            patientId,
            pharmacyId: pharmacy._id,
            items: processedItems,
            subtotal: 0, // Will be calculated in pre-save hook
            totalDiscount: discount,
            totalGST: 0, // Will be calculated in pre-save hook
            grandTotal: 0, // Will be calculated in pre-save hook
            paymentMethod,
            generatedBy: req.user._id
        });

        // Populate details
        await bill.populate([
            { path: 'patientId', select: 'fullName mobile' },
            { path: 'prescriptionId', select: 'prescriptionId diagnosis' }
        ]);

        res.status(201).json({
            message: 'Bill generated successfully',
            bill
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update payment status
// @route   PUT /api/pharmacy/billing/:id/payment
// @access  Private/Pharmacy
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus, paidAmount } = req.body;

        const bill = await Bill.findById(req.params.id);

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        bill.paymentStatus = paymentStatus;
        if (paidAmount) bill.paidAmount = paidAmount;

        await bill.save();

        res.json({
            message: 'Payment status updated',
            bill
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get daily sales report
// @route   GET /api/pharmacy/analytics/daily-sales
// @access  Private/Pharmacy
exports.getDailySales = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ userId: req.user._id });
        const { date } = req.query;

        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const bills = await Bill.find({
            pharmacyId: pharmacy._id,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const totalSales = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
        const totalGST = bills.reduce((sum, bill) => sum + bill.totalGST, 0);
        const totalDiscount = bills.reduce((sum, bill) => sum + bill.totalDiscount, 0);
        const totalBills = bills.length;

        // Payment method breakdown
        const paymentBreakdown = bills.reduce((acc, bill) => {
            acc[bill.paymentMethod] = (acc[bill.paymentMethod] || 0) + bill.grandTotal;
            return acc;
        }, {});

        res.json({
            date: startOfDay,
            totalSales,
            totalGST,
            totalDiscount,
            totalBills,
            paymentBreakdown,
            bills
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get monthly revenue report
// @route   GET /api/pharmacy/analytics/monthly-revenue  
// @access  Private/Pharmacy
exports.getMonthlyRevenue = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ userId: req.user._id });
        const { year, month } = req.query;

        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        const bills = await Bill.find({
            pharmacyId: pharmacy._id,
            createdAt: { $gte: startDate, $lte: endDate }
        });

        const totalRevenue = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
        const totalGST = bills.reduce((sum, bill) => sum + bill.totalGST, 0);
        const totalDiscount = bills.reduce((sum, bill) => sum + bill.totalDiscount, 0);
        const totalBills = bills.length;

        // Daily breakdown
        const dailyRevenue = bills.reduce((acc, bill) => {
            const day = new Date(bill.createdAt).getDate();
            acc[day] = (acc[day] || 0) + bill.grandTotal;
            return acc;
        }, {});

        res.json({
            month: targetMonth + 1,
            year: targetYear,
            totalRevenue,
            totalGST,
            totalDiscount,
            totalBills,
            averagePerBill: totalBills > 0 ? totalRevenue / totalBills : 0,
            dailyRevenue
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get medicine demand forecast
// @route   GET /api/pharmacy/analytics/demand-forecast
// @access  Private/Pharmacy
exports.getDemandForecast = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ userId: req.user._id });
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const bills = await Bill.find({
            pharmacyId: pharmacy._id,
            createdAt: { $gte: startDate }
        });

        // Aggregate medicine sales
        const medicineSales = {};

        bills.forEach(bill => {
            bill.items.forEach(item => {
                const medId = item.medicineId.toString();
                if (!medicineSales[medId]) {
                    medicineSales[medId] = {
                        medicineId: item.medicineId,
                        medicineName: item.medicineName,
                        totalQuantity: 0,
                        totalRevenue: 0,
                        frequency: 0
                    };
                }
                medicineSales[medId].totalQuantity += item.quantity;
                medicineSales[medId].totalRevenue += item.totalPrice;
                medicineSales[medId].frequency += 1;
            });
        });

        // Convert to array and calculate daily average
        const forecast = Object.values(medicineSales).map(med => ({
            ...med,
            dailyAverage: (med.totalQuantity / parseInt(days)).toFixed(2),
            monthlyForecast: Math.ceil((med.totalQuantity / parseInt(days)) * 30)
        })).sort((a, b) => b.totalQuantity - a.totalQuantity);

        res.json({
            period: `Last ${days} days`,
            forecast
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// All functions already exported via exports.functionName above
// @desc    Get sales report
// @route   GET /api/pharmacy/sales-report
// @access  Private/Pharmacy
exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Build query for dispensed prescriptions
        const query = { status: 'dispensed' };
        
        if (startDate || endDate) {
            query.dispensedAt = {};
            if (startDate) query.dispensedAt.$gte = new Date(startDate);
            if (endDate) query.dispensedAt.$lte = new Date(endDate);
        }
        
        const prescriptions = await Prescription.find(query)
            .populate('patientId', 'fullName mobile')
            .populate('doctorId', 'fullName specialization')
            .sort({ dispensedAt: -1 });
        
        res.json({
            summary: {
                totalDispensed: prescriptions.length,
                period: startDate || endDate ? 'custom' : 'all'
            },
            prescriptions
        });
    } catch (error) {
        console.error('Sales Report Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
