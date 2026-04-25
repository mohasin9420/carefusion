// Quick verification of lab tests in MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

const DiagnosticTestCatalog = require('../models/DiagnosticTestCatalog');

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected\n');

        const count = await DiagnosticTestCatalog.countDocuments();
        console.log(`📊 Total Lab Tests in MongoDB: ${count}\n`);

        if (count > 0) {
            console.log('📋 Sample Tests:');
            const samples = await DiagnosticTestCatalog.find().limit(10);
            samples.forEach((test, i) => {
                console.log(`   ${i + 1}. ${test.name} (${test.category})`);
            });

            const categories = await DiagnosticTestCatalog.distinct('category');
            console.log(`\n🏷️  Categories (${categories.length}): ${categories.join(', ')}`);
        } else {
            console.log('⚠️  No lab tests found in MongoDB');
            console.log('\n💡 Run: node scripts/forceImportLabTests.js');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verify();
