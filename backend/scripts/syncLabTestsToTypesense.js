const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const typesenseClient = require('../config/typesense');
require('dotenv').config();

// Create Typesense collection for lab tests
async function createLabTestsCollection() {
    const schema = {
        name: 'labtests',
        fields: [
            { name: 'id', type: 'string' },
            { name: 'name', type: 'string', facet: false },
            { name: 'category', type: 'string', facet: true },
            { name: 'description', type: 'string', facet: false, optional: true },
            { name: 'sort_order', type: 'int32', facet: false }
        ],
        default_sorting_field: 'sort_order'
    };

    try {
        // Delete collection if it exists
        try {
            await typesenseClient.collections('labtests').delete();
            console.log('🗑️  Deleted existing labtests collection');
        } catch (err) {
            // Collection doesn't exist, that's fine
        }

        // Create new collection
        await typesenseClient.collections().create(schema);
        console.log('✅ Created labtests collection in Typesense');
    } catch (error) {
        console.error('❌ Error creating collection:', error);
        throw error;
    }
}

// Read and import lab tests from CSV
async function importLabTestsToTypesense() {
    const csvPath = path.join(__dirname, '../../data/India_Laboratory_Master_Database.csv');

    console.log('📂 Reading CSV file:', csvPath);

    const tests = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
                if (row.test_name && row.test_name.trim()) {
                    tests.push({
                        id: row.id || String(tests.length + 1),
                        name: row.test_name.trim(),
                        category: row.category || 'General',
                        description: row.description || '',
                        sort_order: tests.length + 1
                    });
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`📝 Parsed ${tests.length} tests from CSV`);

    // Import to Typesense in batches
    console.log('\n💾 Importing to Typesense...');
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < tests.length; i += batchSize) {
        const batch = tests.slice(i, i + batchSize);

        try {
            await typesenseClient.collections('labtests')
                .documents()
                .import(batch, { action: 'create' });

            imported += batch.length;
            process.stdout.write(`\r   Progress: ${imported}/${tests.length} tests`);
        } catch (error) {
            console.error(`\n⚠️  Error importing batch ${i}-${i + batch.length}:`, error.message);
        }
    }

    console.log('\n✅ Import to Typesense completed!');
    return imported;
}

// Test search functionality
async function testSearch() {
    console.log('\n🧪 Testing search functionality...');

    const queries = ['blood', 'glucose', 'CBC', 'thyroid'];

    for (const query of queries) {
        const startTime = Date.now();

        try {
            const searchResults = await typesenseClient
                .collections('labtests')
                .documents()
                .search({
                    q: query,
                    query_by: 'name,category,description',
                    per_page: 5
                });

            const timeTaken = Date.now() - startTime;
            console.log(`   "${query}" → ${searchResults.hits.length} results in ${timeTaken}ms`);

            if (searchResults.hits.length > 0) {
                console.log(`      Top result: ${searchResults.hits[0].document.name} (${searchResults.hits[0].document.category})`);
            }
        } catch (error) {
            console.error(`   Error searching for "${query}":`, error.message);
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting Lab Tests Sync to Typesense...\n');

    try {
        // Check Typesense connection
        console.log('🔌 Checking Typesense connection...');
        const health = await typesenseClient.health.retrieve();
        console.log('✅ Typesense is healthy:', health.ok);

        // Create collection
        await createLabTestsCollection();

        // Import data
        const imported = await importLabTestsToTypesense();
        console.log(`\n📊 Total imported: ${imported} lab tests`);

        // Get collection stats
        const collection = await typesenseClient.collections('labtests').retrieve();
        console.log(`📈 Collection stats: ${collection.num_documents} documents`);

        // Test search
        await testSearch();

        console.log('\n✅ Sync process completed successfully!');
        console.log('\n💡 Lab tests are now searchable via Typesense!');
        console.log('   Access at: http://localhost:8108');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Sync failed:', error);
        console.error('Error details:', error.message);

        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Tip: Make sure Typesense Docker container is running:');
            console.log('   docker-compose up -d');
        }

        process.exit(1);
    }
}

// Run the script
main();
