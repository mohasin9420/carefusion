const express = require('express');
const router = express.Router();

// Import controllers
const {
    verifyPrescriptionQR,
    updatePrescriptionStatus,
    getLowStockMedicines,
    getExpiringMedicines,
    recallMedicineBatch,
    searchByBarcode,
    getInventory,
    addMedicineToInventory,
    updateInventory
} = require('../controllers/pharmacyInventoryController');

const {
    getPrescriptions,
    dispensePrescription
} = require('../controllers/pharmacyController');

const {
    generateBill,
    updatePaymentStatus,
    getDailySales,
    getMonthlyRevenue,
    getDemandForecast,
    getSalesReport
} = require('../controllers/pharmacyBillingController');

const {
    createPurchaseOrder,
    getPurchaseOrders,
    updatePurchaseOrderStatus,
    createSupplier,
    getSuppliers,
    updateSupplier
} = require('../controllers/pharmacyPurchaseController');

const { protect, authorize } = require('../middleware/auth');

// All routes protected and require pharmacy role
router.use(protect);
router.use(authorize('pharmacy'));

// ========== Prescription Management ==========
router.get('/prescriptions', getPrescriptions);
router.post('/prescriptions/verify-qr', verifyPrescriptionQR);
router.put('/prescriptions/:id/status', updatePrescriptionStatus);
router.put('/dispense/:id', dispensePrescription);

// ========== Inventory Management ==========
router.get('/inventory', getInventory);
router.post('/inventory', addMedicineToInventory);
router.put('/inventory/:id', updateInventory);
router.get('/inventory/low-stock', getLowStockMedicines);
router.get('/inventory/expiring-soon', getExpiringMedicines);
router.put('/inventory/recall/:id/batch/:batchNumber', recallMedicineBatch);
router.get('/inventory/barcode/:barcode', searchByBarcode);

// ========== Sales Report ==========
router.get('/sales-report', getSalesReport);

// ========== Billing ==========
router.post('/billing/generate', generateBill);
router.put('/billing/:id/payment', updatePaymentStatus);

// ========== Sales Analytics ==========
router.get('/analytics/daily-sales', getDailySales);
router.get('/analytics/monthly-revenue', getMonthlyRevenue);
router.get('/analytics/demand-forecast', getDemandForecast);

// ========== Purchase Orders ==========
router.post('/purchase-orders', createPurchaseOrder);
router.get('/purchase-orders', getPurchaseOrders);
router.put('/purchase-orders/:id/status', updatePurchaseOrderStatus);

// ========== Supplier Management ==========
router.post('/suppliers', createSupplier);
router.get('/suppliers', getSuppliers);
router.put('/suppliers/:id', updateSupplier);

module.exports = router;
