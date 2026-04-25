const axios = require('axios');

async function testSearch() {
    try {
        console.log('Testing search API without auth token...\n');

        const queries = ['para', 'amox', 'ibuprofen'];

        for (const q of queries) {
            try {
                const response = await axios.get(
                    `http://localhost:5000/api/medicines/search?q=${q}&limit=5`
                );

                console.log(`✅ Query: "${q}"`);
                console.log(`   Results: ${response.data.count}`);
                console.log(`   Fallback: ${response.data.fallback || 'No (using Typesense)'}`);
                if (response.data.data && response.data.data.length > 0) {
                    console.log(`   Sample: ${response.data.data[0].name}`);
                }
                console.log('');
            } catch (err) {
                console.log(`❌ Query: "${q}"`);
                console.log(`   Error: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
                console.log('');
            }
        }
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testSearch();
