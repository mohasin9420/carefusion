const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Use existing DiagnosticTestCatalog model
const DiagnosticTestCatalog = require('../models/DiagnosticTestCatalog');

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
}

// Import lab tests from CSV
async function importLabTests() {
    // Use the new master database CSV file (more comprehensive)
    const csvFilePath = path.join(__dirname, '../../data/India_Laboratory_Master_Database.csv');

    if (!fs.existsSync(csvFilePath)) {
        console.error('❌ CSV file not found:', csvFilePath);
        console.log('💡 Fallback: Trying India_Common_Laboratory_Tests_List.csv');

        // Fallback to the smaller CSV if master database not found
        const fallbackPath = path.join(__dirname, '../../data/India_Common_Laboratory_Tests_List.csv');
        if (!fs.existsSync(fallbackPath)) {
            console.error('❌ Fallback CSV also not found');
            process.exit(1);
        }
        return importFromSimpleCSV(fallbackPath);
    }

    console.log('📂 Reading CSV file:', csvFilePath);

    const tests = [];
    let rowCount = 0;
    let errorCount = 0;

    return new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {
                rowCount++;

                try {
                    // Parse CSV row - Master database has: id, test_name, category, sample_type, fasting_required, etc.
                    const test = {
                        name: row.test_name || row['Test Name'] || row.name || row.Name || '',
                        category: row.category || row.Category || 'General',
                        description: row.description || row.Description || ''
                    };

                    // Only add if test name exists and is not empty
                    if (test.name && test.name.trim() !== '') {
                        tests.push(test);
                    }
                } catch (err) {
                    errorCount++;
                    if (errorCount <= 10) {
                        console.warn('⚠️  Error parsing row:', err.message);
                    }
                }
            })
            .on('end', async () => {
                console.log(`\n📊 CSV parsing complete. Total rows: ${rowCount}`);
                console.log(`   Valid tests to import: ${tests.length}`);

                // Insert all tests
                if (tests.length > 0) {
                    console.log(`\n🔄 About to insert ${tests.length} tests...`);
                    const insertedCount = await insertBatch(tests);
                    console.log(`\n✅ Insertion completed. ${insertedCount} tests inserted.`);

                    // Immediately verify
                    const verifyCount = await DiagnosticTestCatalog.countDocuments();
                    console.log(`📊 Immediate verification: ${verifyCount} tests in database`);
                } else {
                    console.log('⚠️  No tests to import!');
                }

                console.log('✅ All lab tests imported successfully!');
                console.log(`   Total imported: ${tests.length}`);
                console.log(`   Errors: ${errorCount}`);

                resolve();
            })
            .on('error', (error) => {
                console.error('❌ Error reading CSV:', error);
                reject(error);
            });
    });
}

// Insert batch of lab tests
async function insertBatch(batch) {
    console.log(`\n🔄 Attempting to insert ${batch.length} tests...`);

    try {
        const result = await DiagnosticTestCatalog.insertMany(batch, { ordered: false });
        console.log(`✅ Successfully inserted: ${result.length} lab tests`);

        // Verify insertion
        const count = await DiagnosticTestCatalog.countDocuments();
        console.log(`📊 Total documents in database: ${count}`);

        return result.length;
    } catch (error) {
        console.error('\n⚠️  Insert error details:');
        console.error('Error code:', error.code);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);

        // Ignore duplicate key errors but count successful inserts
        if (error.code === 11000) {
            const successful = error.insertedDocs ? error.insertedDocs.length : (error.result ? error.result.nInserted : 0);
            console.log(`⚠️  Inserted ${successful} tests (some duplicates skipped)`);
            return successful;
        } else {
            throw error; // Re-throw if not a duplicate error
        }
    }
}

// Create indexes
async function createIndexes() {
    console.log('\n\n🔧 Creating indexes...');

    try {
        await DiagnosticTestCatalog.collection.createIndex({ name: 1 });
        console.log('✅ Index created on "name" field');

        await DiagnosticTestCatalog.collection.createIndex({ category: 1 });
        console.log('✅ Index created on "category" field');

        await DiagnosticTestCatalog.collection.createIndex({ name: 'text', description: 'text' });
        console.log('✅ Text index created for search');

        console.log('✅ All indexes created successfully!');
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting Lab Test Import Process...\n');

    try {
        await connectDB();

        // Clear existing data (optional - comment out if you want to keep existing data)
        const existingCount = await DiagnosticTestCatalog.countDocuments();
        if (existingCount > 0) {
            console.log(`⚠️  Found ${existingCount} existing lab tests in catalog`);
            console.log('🗑️  Clearing old data...');
            await DiagnosticTestCatalog.deleteMany({});
            console.log('✅ Old data cleared\n');
        }

        await importLabTests();
        await createIndexes();

        // Display stats
        const totalCount = await DiagnosticTestCatalog.countDocuments();
        const categories = await DiagnosticTestCatalog.distinct('category');

        console.log('\n📈 Import Statistics:');
        console.log(`   Total lab tests: ${totalCount}`);
        console.log(`   Categories: ${categories.length}`);
        console.log(`   Category list: ${categories.join(', ')}`);

        console.log('\n✅ Import process completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    }
}

// Run the script
main();
