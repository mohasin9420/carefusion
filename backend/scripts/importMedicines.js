const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Medicine Catalog Schema (separate from pharmacy inventory)
const medicineCatalogSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    price: { type: Number },
    manufacturer: { type: String },
    saltComposition: { type: String },
    uses: { type: String },
    sideEffects: { type: String },
    howToUse: { type: String },
    isDiscontinued: { type: Boolean, default: false },
    prescribeCount: { type: Number, default: 0 }, // Required for Typesense default_sorting_field
    importedAt: { type: Date, default: Date.now }
});

// Create text index for fast search
medicineCatalogSchema.index({ name: 'text' });
medicineCatalogSchema.index({ name: 1, isDiscontinued: 1 });

const MedicineCatalog = mongoose.model('MedicineCatalog', medicineCatalogSchema);

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

// Import medicines from CSV
async function importMedicines() {
    const csvFilePath = path.join(__dirname, '../../data/updated_indian_medicine_data.csv');

    if (!fs.existsSync(csvFilePath)) {
        console.error('❌ CSV file not found:', csvFilePath);
        process.exit(1);
    }

    console.log('📂 Reading CSV file:', csvFilePath);

    const medicines = [];
    let rowCount = 0;
    let errorCount = 0;

    return new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {
                rowCount++;

                try {
                    // Parse CSV row - adjust field names based on your CSV headers
                    const medicine = {
                        name: row.name || row.Name || row.medicine_name,
                        price: parseFloat(row.price || row.Price || 0),
                        manufacturer: row.manufacturer || row.Manufacturer || '',
                        saltComposition: row.salt_composition || row.composition || row.saltComposition || '',
                        uses: row.uses || row.Uses || '',
                        sideEffects: row.side_effects || row.sideEffects || row['side effects'] || '',
                        howToUse: row.how_to_use || row.howToUse || row['how to use'] || '',
                        isDiscontinued: (row.is_discontinued || row.Is_discontinued || '').toLowerCase() === 'true'
                    };

                    // Only add if medicine name exists
                    if (medicine.name && medicine.name.trim() !== '') {
                        medicines.push(medicine);
                    }

                    // Batch insert every 1000 records for performance
                    if (medicines.length >= 1000) {
                        insertBatch(medicines.splice(0, 1000));
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

                // Insert remaining medicines
                if (medicines.length > 0) {
                    await insertBatch(medicines);
                }

                console.log('✅ All medicines imported successfully!');
                console.log(`   Total imported: ${rowCount - errorCount}`);
                console.log(`   Errors: ${errorCount}`);

                resolve();
            })
            .on('error', (error) => {
                console.error('❌ Error reading CSV:', error);
                reject(error);
            });
    });
}

// Insert batch of medicines
async function insertBatch(batch) {
    try {
        await MedicineCatalog.insertMany(batch, { ordered: false });
        process.stdout.write(`\r⏳ Inserted: ${await MedicineCatalog.countDocuments()} medicines`);
    } catch (error) {
        // Ignore duplicate key errors
        if (error.code !== 11000) {
            console.error('\n⚠️  Batch insert error:', error.message);
        }
    }
}

// Create indexes
async function createIndexes() {
    console.log('\n\n🔧 Creating indexes...');

    try {
        await MedicineCatalog.collection.createIndex({ name: 'text' });
        console.log('✅ Text index created on "name" field');

        await MedicineCatalog.collection.createIndex({ name: 1, isDiscontinued: 1 });
        console.log('✅ Compound index created on "name" and "isDiscontinued"');

        await MedicineCatalog.collection.createIndex({ manufacturer: 1 });
        console.log('✅ Index created on "manufacturer" field');

        console.log('✅ All indexes created successfully!');
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting Medicine Import Process...\n');

    try {
        await connectDB();

        // Clear existing data (optional - comment out if you want to keep existing data)
        const existingCount = await MedicineCatalog.countDocuments();
        if (existingCount > 0) {
            console.log(`⚠️  Found ${existingCount} existing medicines in catalog`);
            console.log('🗑️  Clearing old data...');
            await MedicineCatalog.deleteMany({});
            console.log('✅ Old data cleared\n');
        }

        await importMedicines();
        await createIndexes();

        // Display stats
        const totalCount = await MedicineCatalog.countDocuments();
        const discontinuedCount = await MedicineCatalog.countDocuments({ isDiscontinued: true });

        console.log('\n📈 Import Statistics:');
        console.log(`   Total medicines: ${totalCount}`);
        console.log(`   Active medicines: ${totalCount - discontinuedCount}`);
        console.log(`   Discontinued: ${discontinuedCount}`);

        // Test search performance
        console.log('\n🧪 Testing search performance...');
        const testQueries = ['para', 'amox', 'az', 'ibuprofen'];

        for (const query of testQueries) {
            const startTime = Date.now();
            const results = await MedicineCatalog.find(
                {
                    $text: { $search: query },
                    isDiscontinued: { $ne: true }
                },
                { score: { $meta: 'textScore' } }
            )
                .sort({ score: { $meta: 'textScore' } })
                .limit(10);

            const timeTaken = Date.now() - startTime;
            console.log(`   "${query}" → ${results.length} results in ${timeTaken}ms`);
        }

        console.log('\n✅ Import process completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    }
}

// Run the script
main();
