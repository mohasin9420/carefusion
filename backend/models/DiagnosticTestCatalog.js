const mongoose = require('mongoose');

const diagnosticTestCatalogSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    category: {
        type: String,
        required: true,
        index: true
    },
    description: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('DiagnosticTestCatalog', diagnosticTestCatalogSchema);
