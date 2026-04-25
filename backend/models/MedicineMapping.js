const mongoose = require('mongoose');

const medicineMappingSchema = new mongoose.Schema({
    diseaseName: {
        type: String,
        required: true,
        index: true
    },
    diseaseType: {
        type: String, // e.g., 'Viral', 'Bacterial', 'Type 1'
        default: ''
    },
    severity: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe', 'All'],
        default: 'All'
    },
    suggestedMedicines: [{
        name: { type: String, required: true },
        dosage: String,
        frequency: String,
        duration: String,
        notes: String
    }],
    notes: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compound index for optimized lookup
medicineMappingSchema.index({ diseaseName: 1, diseaseType: 1, severity: 1 });

module.exports = mongoose.model('MedicineMapping', medicineMappingSchema);
