const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    billNumber: {
        type: String,
        unique: true,
        default: () => `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    },
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
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
        batchNumber: String,
        quantity: {
            type: Number,
            required: true
        },
        unitPrice: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            default: 0
        },
        gstRate: {
            type: Number,
            default: 12 // 12% GST for medicines
        },
        gstAmount: Number,
        totalPrice: Number
    }],
    subtotal: {
        type: Number,
        required: true
    },
    totalDiscount: {
        type: Number,
        default: 0
    },
    totalGST: {
        type: Number,
        required: true
    },
    grandTotal: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'insurance', 'online'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'partial', 'refunded'],
        default: 'pending'
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    balanceAmount: Number,
    insuranceClaim: {
        claimNumber: String,
        provider: String,
        claimAmount: Number,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected']
        }
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: String
}, {
    timestamps: true
});

// Calculate bill totals before saving
billSchema.pre('save', function (next) {
    this.items.forEach(item => {
        const itemSubtotal = item.quantity * item.unitPrice;
        const discountAmount = (itemSubtotal * item.discount) / 100;
        const taxableAmount = itemSubtotal - discountAmount;
        item.gstAmount = (taxableAmount * item.gstRate) / 100;
        item.totalPrice = taxableAmount + item.gstAmount;
    });

    this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    this.totalDiscount = this.items.reduce((sum, item) => {
        return sum + ((item.quantity * item.unitPrice * item.discount) / 100);
    }, 0);
    this.totalGST = this.items.reduce((sum, item) => sum + item.gstAmount, 0);
    this.grandTotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.balanceAmount = this.grandTotal - this.paidAmount;

    next();
});

module.exports = mongoose.model('Bill', billSchema);
