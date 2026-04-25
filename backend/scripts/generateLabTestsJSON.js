// Generate JSON file for manual MongoDB Atlas import
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

async function generateJSON() {
    const csvPath = path.join(__dirname, '../../data/India_Laboratory_Master_Database.csv');
    const jsonPath = path.join(__dirname, '../../data/lab_tests_import.json');

    console.log('📂 Reading CSV:', csvPath);

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
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`📝 Parsed ${tests.length} tests`);
    console.log('\n💾 Writing JSON file...');

    fs.writeFileSync(jsonPath, JSON.stringify(tests, null, 2));

    console.log(`✅ JSON file created: ${jsonPath}`);
    console.log(`   File size: ${(fs.statSync(jsonPath).size / 1024).toFixed(2)} KB`);
    console.log(`   Total tests: ${tests.length}`);

    // Also create a smaller sample for testing
    const samplePath = path.join(__dirname, '../../data/lab_tests_sample.json');
    const sample = tests.slice(0, 20);
    fs.writeFileSync(samplePath, JSON.stringify(sample, null, 2));
    console.log(`\n📋 Sample file created: ${samplePath}`);
    console.log(`   Sample size: ${sample.length} tests`);

    console.log('\n📊 Category breakdown:');
    const categories = {};
    tests.forEach(test => {
        categories[test.category] = (categories[test.category] || 0) + 1;
    });
    Object.entries(categories).forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count} tests`);
    });
}

generateJSON().catch(console.error);
