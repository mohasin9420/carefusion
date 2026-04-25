// Quick script to check MongoDB collections for lab and medicine data
const mongoose = require('mongoose');
require('dotenv').config();

const DiagnosticTestCatalog = require('../models/DiagnosticTestCatalog');
const MedicineCatalog = require('../models/MedicineCatalog');

async function checkCollections() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📚 All Collections in Database:');
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });

        console.log('\n📊 Data Counts:');

        // Medicine Catalog
        const medicineCount = await MedicineCatalog.countDocuments();
        console.log(`   medicines/medicinecatalogs: ${medicineCount.toLocaleString()} medicines`);

        // Diagnostic Test Catalog
        const testCount = await DiagnosticTestCatalog.countDocuments();
        console.log(`   diagnostictestcatalogs: ${testCount.toLocaleString()} lab tests`);

        if (testCount > 0) {
            console.log('\n🧪 Sample Lab Tests:');
            const samples = await DiagnosticTestCatalog.find().limit(5);
            samples.forEach((test, i) => {
                console.log(`   ${i + 1}. ${test.name} (${test.category})`);
            });

            const categories = await DiagnosticTestCatalog.distinct('category');
            console.log(`\n🏷️  Test Categories (${categories.length}):`);
            categories.forEach(cat => {
                console.log(`   - ${cat}`);
            });
        } else {
            console.log('\n⚠️  No lab tests found in database');
            console.log('💡 Run: node scripts/importLabTests.js to import tests');
        }

        if (medicineCount > 0) {
            console.log(`\n💊 Medicine Catalog Status: ✅ ${medicineCount.toLocaleString()} medicines loaded`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkCollections();
