const mongoose = require('mongoose');

const pharmacyStockSchema = new mongoose.Schema({
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicineCatalog',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    genericName: String,
    category: {
        type: String,
        enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'other'],
        default: 'tablet'
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    unit: {
        type: String,
        enum: ['strip', 'bottle', 'box', 'piece', 'vial'],
        default: 'strip'
    },
    minQuantity: {
        type: Number,
        default: 10
    },
    status: {
        type: String,
        enum: ['in_stock', 'low_stock', 'out_of_stock'],
        default: 'in_stock'
    },
    batchNumber: String,
    expiryDate: Date,
    supplier: String,
    lastRestocked: Date
}, {
    timestamps: true
});

// Auto-update status based on quantity
pharmacyStockSchema.pre('save', function (next) {
    if (this.quantity === 0) {
        this.status = 'out_of_stock';
    } else if (this.quantity <= this.minQuantity) {
        this.status = 'low_stock';
    } else {
        this.status = 'in_stock';
    }
    next();
});

pharmacyStockSchema.index({ name: 1 });
pharmacyStockSchema.index({ status: 1 });
pharmacyStockSchema.index({ medicineId: 1 });

module.exports = mongoose.model('PharmacyStock', pharmacyStockSchema);
