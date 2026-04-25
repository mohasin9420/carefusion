// Alternative import approach - create collection explicitly first
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
require('dotenv').config();

async function forceImport() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected\n');

        // Get the database
        const db = mongoose.connection.db;

        // Try to create collection explicitly
        console.log('🔧 Creating collection explicitly...');
        try {
            await db.createCollection('diagnostictestcatalogs', {
                validator: {
                    $jsonSchema: {
                        bsonType: "object",
                        required: ["name", "category"],
                        properties: {
                            name: { bsonType: "string" },
                            category: { bsonType: "string" },
                            description: { bsonType: "string" }
                        }
                    }
                }
            });
            console.log('✅ Collection created');
        } catch (err) {
            if (err.code === 48) {
                console.log('ℹ️  Collection already exists');
            } else {
                console.log('⚠️  Collection creation:', err.message);
            }
        }

        // Get collection
        const collection = db.collection('diagnostictestcatalogs');

        // Read and parse CSV
        const csvPath = path.join(__dirname, '../../data/India_Laboratory_Master_Database.csv');
        console.log('\n📂 Reading CSV:', csvPath);

        const tests = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.test_name && row.test_name.trim()) {
                        tests.push({
                            name: row.test_name.trim(),
                            category: row.category || 'General',
                            description: row.description || '',
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`📝 Parsed ${tests.length} tests\n`);

        // Clear existing
        const deleteResult = await collection.deleteMany({});
        console.log(`🗑️  Cleared ${deleteResult.deletedCount} old records`);

        // Insert with native driver (not Mongoose)
        console.log('\n💾 Inserting tests...');

        // Try small batch first
        const testBatch = tests.slice(0, 10);
        console.log(`🧪 Testing with ${testBatch.length} records first...`);

        try {
            const result = await collection.insertMany(testBatch);
            console.log(`✅ Test successful! Inserted ${result.insertedCount} records`);

            // Now insert the rest
            if (tests.length > 10) {
                console.log(`\n💾 Inserting remaining ${tests.length - 10} tests...`);
                const remaining = tests.slice(10);
                const finalResult = await collection.insertMany(remaining);
                console.log(`✅ Inserted ${finalResult.insertedCount} more records`);
            }
        } catch (insertErr) {
            console.error('❌ Insert Error:', insertErr.message);
            console.error('Error code:', insertErr.code);
            console.error('Error name:', insertErr.name);
            throw insertErr;
        }

        // Verify final count
        const finalCount = await collection.countDocuments();
        console.log(`\n📊 Final count: ${finalCount} tests in database`);

        if (finalCount > 0) {
            const samples = await collection.find().limit(5).toArray();
            console.log('\n📋 Sample tests:');
            samples.forEach((doc, i) => {
                console.log(`   ${i + 1}. ${doc.name} (${doc.category})`);
            });
        }

        await mongoose.connection.close();
        console.log('\n✅ Import completed!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Fatal Error:', error);
        process.exit(1);
    }
}

forceImport();
