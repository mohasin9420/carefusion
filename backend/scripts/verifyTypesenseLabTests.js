// Quick verification script for Typesense lab tests
const typesenseClient = require('../config/typesense');
require('dotenv').config();

async function verifyLabTests() {
    try {
        console.log('🔍 Verifying Lab Tests in Typesense...\n');

        // Get collection info
        const collection = await typesenseClient.collections('labtests').retrieve();
        console.log(`✅ Collection: ${collection.name}`);
        console.log(`📊 Total documents: ${collection.num_documents}`);
        console.log(`🏷️  Fields: ${collection.fields.map(f => f.name).join(', ')}\n`);

        // Get all categories
        const categorySearch = await typesenseClient
            .collections('labtests')
            .documents()
            .search({
                q: '*',
                query_by: 'name',
                facet_by: 'category',
                per_page: 0
            });

        console.log('📋 Categories:');
        if (categorySearch.facet_counts && categorySearch.facet_counts.length > 0) {
            categorySearch.facet_counts[0].counts.forEach(cat => {
                console.log(`   ${cat.value}: ${cat.count} tests`);
            });
        }

        // Test searches
        console.log('\n🧪 Test Searches:');
        const testQueries = ['CBC', 'blood glucose', 'thyroid', 'liver'];

        for (const query of testQueries) {
            const results = await typesenseClient
                .collections('labtests')
                .documents()
                .search({
                    q: query,
                    query_by: 'name,category,description',
                    per_page: 3
                });

            console.log(`\n   Query: "${query}" → ${results.found} results`);
            results.hits.forEach((hit, i) => {
                console.log(`      ${i + 1}. ${hit.document.name} (${hit.document.category})`);
            });
        }

        console.log('\n✅ Verification complete!');
        console.log('\n💡 Typesense lab tests are ready for use in your application!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verifyLabTests();
