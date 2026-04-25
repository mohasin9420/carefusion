const mongoose = require('mongoose');

// Medicine Catalog Schema (separate from pharmacy inventory)
const medicineCatalogSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    price: {
        type: Number
    },
    manufacturer: {
        type: String
    },
    saltComposition: {
        type: String
    },
    uses: {
        type: String
    },
    sideEffects: {
        type: String
    },
    howToUse: {
        type: String
    },
    isDiscontinued: {
        type: Boolean,
        default: false
    },
    prescribeCount: {
        type: Number,
        default: 0,
        index: true
    },
    importedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create text index for fast search
medicineCatalogSchema.index({ name: 'text' });
medicineCatalogSchema.index({ name: 1, isDiscontinued: 1 });
medicineCatalogSchema.index({ manufacturer: 1 });

module.exports = mongoose.model('MedicineCatalog', medicineCatalogSchema);
