const mongoose = require('mongoose');
const typesenseClient = require('../config/typesense');
const MedicineCatalog = require('../models/MedicineCatalog');
require('dotenv').config();

// Connect to MongoDB with timeout settings
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000, // 30 seconds timeout for initial connection
            socketTimeoutMS: 45000, // 45 seconds socket timeout
            maxPoolSize: 10,
            minPoolSize: 2,
        });
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        console.error('\n💡 Troubleshooting tips:');
        console.error('   1. Check MongoDB Atlas Network Access - whitelist your IP');
        console.error('   2. Verify your internet connection');
        console.error('   3. Check if MongoDB cluster is running (not paused)');
        process.exit(1);
    }
}

// Create Typesense collection schema
async function createTypesenseCollection() {
    const schema = {
        name: 'medicines',
        fields: [
            { name: 'name', type: 'string', facet: false },
            { name: 'manufacturer', type: 'string', facet: true, optional: true },
            { name: 'price', type: 'float', facet: false, optional: false },
            { name: 'saltComposition', type: 'string', facet: false, optional: true },
            { name: 'uses', type: 'string', facet: false, optional: true },
            { name: 'sideEffects', type: 'string', facet: false, optional: true },
            { name: 'howToUse', type: 'string', facet: false, optional: true },
            { name: 'isDiscontinued', type: 'bool', facet: true, optional: true },
            { name: 'prescribeCount', type: 'int32', facet: false, optional: false, index: true }
        ],
        default_sorting_field: 'prescribeCount'
    };

    try {
        // Delete collection if it exists
        try {
            await typesenseClient.collections('medicines').delete();
            console.log('🗑️  Deleted existing medicines collection');
        } catch (err) {
            // Collection doesn't exist, that's fine
        }

        // Create new collection
        await typesenseClient.collections().create(schema);
        console.log('✅ Created medicines collection in Typesense');
    } catch (error) {
        console.error('❌ Error creating collection:', error);
        throw error;
    }
}

// Sync medicines from MongoDB to Typesense
async function syncMedicines() {
    console.log('⏳ Fetching medicines from MongoDB...');

    const medicines = await MedicineCatalog.find({}).lean();
    console.log(`📊 Found ${medicines.length} medicines in MongoDB`);

    if (medicines.length === 0) {
        console.log('⚠️  No medicines found. Run importMedicines.js first!');
        return;
    }

    console.log('⏳ Importing to Typesense...');

    // Prepare documents for Typesense
    const typesenseDocs = medicines.map(med => ({
        id: med._id.toString(),
        name: med.name || '',
        manufacturer: med.manufacturer || '',
        price: med.price || 0,
        saltComposition: med.saltComposition || '',
        uses: med.uses || '',
        sideEffects: med.sideEffects || '',
        howToUse: med.howToUse || '',
        isDiscontinued: med.isDiscontinued || false,
        prescribeCount: med.prescribeCount || 0
    }));

    // Import in batches for better performance
    const batchSize = 1000;
    let imported = 0;

    for (let i = 0; i < typesenseDocs.length; i += batchSize) {
        const batch = typesenseDocs.slice(i, i + batchSize);

        try {
            await typesenseClient.collections('medicines').documents().import(batch, {
                action: 'create'
            });
            imported += batch.length;
            process.stdout.write(`\r⏳ Imported: ${imported} / ${typesenseDocs.length} medicines`);
        } catch (error) {
            console.error(`\n⚠️  Error importing batch ${i / batchSize}:`, error.message);
        }
    }

    console.log('\n✅ Sync complete!');
}

// Test search performance
async function testSearch() {
    console.log('\n🧪 Testing search performance...\n');

    const testQueries = ['para', 'amox', 'az', 'ibuprofen', 'paracetmol']; // Note the typo in last one

    for (const query of testQueries) {
        const startTime = Date.now();

        try {
            const searchResults = await typesenseClient
                .collections('medicines')
                .documents()
                .search({
                    q: query,
                    query_by: 'name,manufacturer,saltComposition',
                    per_page: 10,
                    filter_by: 'isDiscontinued:=false',
                    typo_tokens_threshold: 1, // Enable typo tolerance
                    num_typos: 2 // Allow up to 2 typos
                });

            const timeTaken = Date.now() - startTime;
            console.log(`   "${query}" → ${searchResults.hits.length} results in ${timeTaken}ms`);

            if (searchResults.hits.length > 0) {
                console.log(`      Top result: ${searchResults.hits[0].document.name}`);
            }
        } catch (error) {
            console.error(`   "${query}" → Error:`, error.message);
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting Typesense Sync...\n');

    try {
        // Test Typesense connection first
        try {
            await typesenseClient.health.retrieve();
            console.log('✅ Typesense connected\n');
        } catch (error) {
            console.error('❌ Cannot connect to Typesense!');
            console.error('Make sure Typesense is running: docker-compose up -d');
            console.error('Error:', error.message);
            process.exit(1);
        }

        await connectDB();
        await createTypesenseCollection();
        await syncMedicines();
        await testSearch();

        console.log('\n✅ All done! Typesense is ready to use.');
        console.log('\n💡 Next steps:');
        console.log('   1. The search API will now use Typesense automatically');
        console.log('   2. Frontend needs no changes');
        console.log('   3. Test by searching in the doctor dashboard\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Sync failed:', error);
        process.exit(1);
    }
}

// Run the script
main();
