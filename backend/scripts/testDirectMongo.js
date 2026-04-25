// Direct MongoDB insertion test - bypass Mongoose completely
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function directInsertTest() {
    const client = new MongoClient(process.env.MONGO_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db();
        const collection = db.collection('diagnostictestcatalogs');

        // Check existing
        const existingCount = await collection.countDocuments();
        console.log(`📊 Existing tests: ${existingCount}`);

        // Try inserting test data
        console.log('\n🧪 Testing direct insertion...');
        const testData = [
            { name: 'Test 1 - CBC', category: 'Hematology', description: 'Complete Blood Count', createdAt: new Date(), updatedAt: new Date() },
            { name: 'Test 2 - Glucose', category: 'Biochemistry', description: 'Blood Glucose Test', createdAt: new Date(), updatedAt: new Date() },
            { name: 'Test 3 - TSH', category: 'Thyroid', description: 'Thyroid Function', createdAt: new Date(), updatedAt: new Date() }
        ];

        const result = await collection.insertMany(testData);
        console.log(`✅ Inserted ${result.insertedCount} test documents`);

        // Verify
        const newCount = await collection.countDocuments();
        console.log(`📊 Total tests now: ${newCount}`);

        // Show what's there
        const docs = await collection.find().limit(5).toArray();
        console.log('\n📋 Sample documents:');
        docs.forEach((doc, i) => {
            console.log(`   ${i + 1}. ${doc.name} (${doc.category})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

directInsertTest();
