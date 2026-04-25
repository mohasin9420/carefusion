// Simplified lab test import - more reliable version
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const DiagnosticTestCatalog = require('../models/DiagnosticTestCatalog');

async function importTests() {
    try {
        // Connect
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected\n');

        // Clear old data
        const oldCount = await DiagnosticTestCatalog.countDocuments();
        if (oldCount > 0) {
            console.log(`🗑️  Clearing ${oldCount} old tests...`);
            await DiagnosticTestCatalog.deleteMany({});
        }

        // Read CSV
        const csvPath = path.join(__dirname, '../../data/India_Laboratory_Master_Database.csv');
        console.log('📂 Reading:', csvPath);

        const tests = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.test_name && row.test_name.trim()) {
                        tests.push({
                            name: row.test_name.trim(),
                            category: row.category || 'General',
                            description: row.description || ''
                        });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`📝 Parsed ${tests.length} tests from CSV\n`);

        // Insert in smaller batches
        console.log('💾 Inserting to MongoDB...');
        let inserted = 0;
        const batchSize = 100;

        for (let i = 0; i < tests.length; i += batchSize) {
            const batch = tests.slice(i, i + batchSize);
            try {
                await DiagnosticTestCatalog.insertMany(batch, { ordered: false });
                inserted += batch.length;
                process.stdout.write(`\r   Progress: ${inserted}/${tests.length} tests`);
            } catch (err) {
                // Count successful inserts even if some fail
                if (err.writeErrors) {
                    inserted += batch.length - err.writeErrors.length;
                }
            }
        }

        console.log('\n');

        // Verify
        const finalCount = await DiagnosticTestCatalog.countDocuments();
        console.log(`✅ Import Complete!`);
        console.log(`   Total in database: ${finalCount} tests`);

        // Show samples
        if (finalCount > 0) {
            console.log('\n📋 Sample Tests:');
            const samples = await DiagnosticTestCatalog.find().limit(5);
            samples.forEach((test, i) => {
                console.log(`   ${i + 1}. ${test.name} (${test.category})`);
            });

            const categories = await DiagnosticTestCatalog.distinct('category');
            console.log(`\n🏷️  Categories: ${categories.join(', ')}`);
        }

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

importTests();
