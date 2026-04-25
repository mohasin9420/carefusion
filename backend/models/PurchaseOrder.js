const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
    poNumber: {
        type: String,
        unique: true,
        default: () => `PO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true
    },
    items: [{
        medicineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine'
        },
        medicineName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        unitPrice: {
            type: Number,
            required: true
        },
        totalPrice: Number,
        batchNumber: String,
        expiryDate: Date
    }],
    subtotal: {
        type: Number,
        required: true
    },
    gstAmount: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'confirmed', 'received', 'cancelled'],
        default: 'draft'
    },
    expectedDeliveryDate: Date,
    actualDeliveryDate: Date,
    paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'paid'],
        default: 'pending'
    },
    paymentDueDate: Date,
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Calculate totals before saving
purchaseOrderSchema.pre('save', function (next) {
    this.items.forEach(item => {
        item.totalPrice = item.quantity * item.unitPrice;
    });

    this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.totalAmount = this.subtotal + this.gstAmount - this.discount;

    next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
