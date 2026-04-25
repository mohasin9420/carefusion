// Quick script to check if lab tests were imported
const mongoose = require('mongoose');
require('dotenv').config();

const DiagnosticTestCatalog = mongoose.model('DiagnosticTestCatalog', new mongoose.Schema({
    name: String,
    category: String,
    description: String
}));

async function checkImport() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const count = await DiagnosticTestCatalog.countDocuments();
        console.log(`📊 Total Lab Tests in Database: ${count}`);

        if (count > 0) {
            console.log('\n📋 Sample tests:');
            const samples = await DiagnosticTestCatalog.find().limit(10);
            samples.forEach((test, i) => {
                console.log(`${i + 1}. ${test.name} (${test.category})`);
            });

            const categories = await DiagnosticTestCatalog.distinct('category');
            console.log(`\n🏷️  Categories (${categories.length}):`);
            categories.forEach(cat => {
                console.log(`   - ${cat}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkImport();
