const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    genericName: String,
    category: {
        type: String,
        enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'other'],
        default: 'other'
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0
    },
    minQuantity: {
        type: Number,
        default: 10
    },
    reorderLevel: {
        type: Number,
        default: 10
    },
    unit: {
        type: String,
        default: 'strip'
    },
    status: {
        type: String,
        enum: ['in_stock', 'low_stock', 'out_of_stock'],
        default: 'in_stock'
    },
    pricePerUnit: Number,
    expiryDate: Date,
    manufacturer: String,
    // Enhanced Inventory Fields
    batches: [{
        batchNumber: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        expiryDate: {
            type: Date,
            required: true
        },
        manufacturingDate: Date,
        supplier: String,
        purchasePrice: Number,
        mrp: Number,
        isRecalled: {
            type: Boolean,
            default: false
        },
        recallReason: String,
        recallDate: Date
    }],
    barcode: {
        type: String,
        unique: true,
        sparse: true // Allows null values
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    // Alert Settings
    expiryAlertDays: {
        type: Number,
        default: 90 // Alert 90 days before expiry
    },
    lastRestocked: Date,
    totalSold: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

medicineSchema.index({ name: 'text', genericName: 'text' });

// Auto-update status based on quantity
medicineSchema.pre('save', function (next) {
    if (this.quantity <= 0) {
        this.status = 'out_of_stock';
    } else if (this.quantity <= this.minQuantity) {
        this.status = 'low_stock';
    } else {
        this.status = 'in_stock';
    }
    next();
});

module.exports = mongoose.model('Medicine', medicineSchema);
