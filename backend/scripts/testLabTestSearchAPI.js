// Test lab tests search API
const axios = require('axios');

async function testLabTestSearch() {
    try {
        console.log('🧪 Testing Lab Tests Search API...\n');

        // First get a token (adjust credentials as needed)
        console.log('🔑 Logging in to get auth token...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@hospital.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Authentication successful\n');

        // Test queries
        const queries = ['CBC', 'blood', 'glucose', 'thyroid', 'liver'];

        for (const q of queries) {
            try {
                const response = await axios.get(
                    `http://localhost:5000/api/lab-tests/search?q=${q}&limit=5`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                console.log(`✅ Query: "${q}"`);
                console.log(`   Results: ${response.data.count}`);
                console.log(`   Search Time: ${response.data.searchTime}ms`);
                console.log(`   Fallback: ${response.data.fallback || 'No (using Typesense)'}`);

                if (response.data.data && response.data.data.length > 0) {
                    console.log(`   Top result: ${response.data.data[0].name} (${response.data.data[0].category})`);
                }
                console.log('');
            } catch (err) {
                console.log(`❌ Query: "${q}"`);
                console.log(`   Error: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
                console.log('');
            }
        }

        // Test category endpoint
        console.log('🏷️  Testing categories endpoint...');
        const categoriesResponse = await axios.get(
            'http://localhost:5000/api/lab-tests/categories',
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        console.log(`✅ Found ${categoriesResponse.data.data.length} categories:`);
        console.log(`   ${categoriesResponse.data.data.join(', ')}\n`);

        console.log('✅ All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response?.data) {
            console.error('   Response:', error.response.data);
        }
    }
}

testLabTestSearch();
