const mongoose = require('mongoose');
const typesenseClient = require('../config/typesense');
const DiagnosticTestCatalog = require('../models/DiagnosticTestCatalog');
require('dotenv').config();

const diagnosticTests = [
    // 🧪 1️⃣ Hematology Tests
    { name: 'Complete Blood Count (CBC)', category: 'Hematology' },
    { name: 'Hemoglobin', category: 'Hematology' },
    { name: 'Red Blood Cell Count', category: 'Hematology' },
    { name: 'White Blood Cell Count', category: 'Hematology' },
    { name: 'Platelet Count', category: 'Hematology' },
    { name: 'Packed Cell Volume', category: 'Hematology' },
    { name: 'Mean Corpuscular Volume', category: 'Hematology' },
    { name: 'Mean Corpuscular Hemoglobin', category: 'Hematology' },
    { name: 'Mean Corpuscular Hemoglobin Concentration', category: 'Hematology' },
    { name: 'Differential Leukocyte Count', category: 'Hematology' },
    { name: 'Neutrophils', category: 'Hematology' },
    { name: 'Lymphocytes', category: 'Hematology' },
    { name: 'Monocytes', category: 'Hematology' },
    { name: 'Eosinophils', category: 'Hematology' },
    { name: 'Basophils', category: 'Hematology' },
    { name: 'ESR', category: 'Hematology' },
    { name: 'Peripheral Smear', category: 'Hematology' },
    { name: 'Reticulocyte Count', category: 'Hematology' },
    { name: 'Absolute Neutrophil Count', category: 'Hematology' },
    { name: 'Absolute Lymphocyte Count', category: 'Hematology' },
    { name: 'Bleeding Time', category: 'Hematology' },
    { name: 'Clotting Time', category: 'Hematology' },
    { name: 'Prothrombin Time', category: 'Hematology' },
    { name: 'INR', category: 'Hematology' },
    { name: 'APTT', category: 'Hematology' },
    { name: 'D-Dimer', category: 'Hematology' },
    { name: 'Fibrinogen', category: 'Hematology' },
    { name: 'Blood Group & Rh Typing', category: 'Hematology' },
    { name: 'Coombs Test', category: 'Hematology' },
    { name: 'Hematocrit', category: 'Hematology' },

    // 🧪 2️⃣ Diabetes & Metabolic Tests
    { name: 'Fasting Blood Sugar', category: 'Diabetes & Metabolic' },
    { name: 'Postprandial Blood Sugar', category: 'Diabetes & Metabolic' },
    { name: 'Random Blood Sugar', category: 'Diabetes & Metabolic' },
    { name: 'HbA1c', category: 'Diabetes & Metabolic' },
    { name: 'Oral Glucose Tolerance Test', category: 'Diabetes & Metabolic' },
    { name: 'Glucose Challenge Test', category: 'Diabetes & Metabolic' },
    { name: 'Serum Insulin', category: 'Diabetes & Metabolic' },
    { name: 'C-Peptide', category: 'Diabetes & Metabolic' },
    { name: 'Fructosamine', category: 'Diabetes & Metabolic' },
    { name: 'Fasting Insulin', category: 'Diabetes & Metabolic' },
    { name: 'HOMA-IR', category: 'Diabetes & Metabolic' },
    { name: 'Total Cholesterol', category: 'Lipid Profile' },
    { name: 'HDL Cholesterol', category: 'Lipid Profile' },
    { name: 'LDL Cholesterol', category: 'Lipid Profile' },
    { name: 'VLDL', category: 'Lipid Profile' },
    { name: 'Triglycerides', category: 'Lipid Profile' },
    { name: 'Non-HDL Cholesterol', category: 'Lipid Profile' },
    { name: 'Cholesterol/HDL Ratio', category: 'Lipid Profile' },
    { name: 'Apolipoprotein A1', category: 'Lipid Profile' },
    { name: 'Apolipoprotein B', category: 'Lipid Profile' },
    { name: 'Lipoprotein (a)', category: 'Lipid Profile' },

    // 🧪 3️⃣ Liver Function Tests
    { name: 'Liver Function Test', category: 'Liver Function' },
    { name: 'SGPT (ALT)', category: 'Liver Function' },
    { name: 'SGOT (AST)', category: 'Liver Function' },
    { name: 'Bilirubin Total', category: 'Liver Function' },
    { name: 'Bilirubin Direct', category: 'Liver Function' },
    { name: 'Bilirubin Indirect', category: 'Liver Function' },
    { name: 'Alkaline Phosphatase', category: 'Liver Function' },
    { name: 'Gamma GT', category: 'Liver Function' },
    { name: 'Total Protein', category: 'Liver Function' },
    { name: 'Albumin', category: 'Liver Function' },
    { name: 'Globulin', category: 'Liver Function' },
    { name: 'A/G Ratio', category: 'Liver Function' },
    { name: 'Serum Ammonia', category: 'Liver Function' },

    // 🧪 4️⃣ Kidney Function Tests
    { name: 'Kidney Function Test', category: 'Kidney Function' },
    { name: 'Serum Creatinine', category: 'Kidney Function' },
    { name: 'Blood Urea', category: 'Kidney Function' },
    { name: 'Blood Urea Nitrogen', category: 'Kidney Function' },
    { name: 'Uric Acid', category: 'Kidney Function' },
    { name: 'eGFR', category: 'Kidney Function' },
    { name: 'Sodium', category: 'Kidney Function' },
    { name: 'Potassium', category: 'Kidney Function' },
    { name: 'Chloride', category: 'Kidney Function' },
    { name: 'Calcium', category: 'Kidney Function' },
    { name: 'Phosphorus', category: 'Kidney Function' },
    { name: 'Magnesium', category: 'Kidney Function' },
    { name: 'Urine Albumin', category: 'Kidney Function' },
    { name: 'Microalbumin', category: 'Kidney Function' },
    { name: 'Creatinine Clearance', category: 'Kidney Function' },

    // 🦠 5️⃣ Infection & Serology Tests
    { name: 'C-Reactive Protein', category: 'Serology' },
    { name: 'Procalcitonin', category: 'Serology' },
    { name: 'Blood Culture', category: 'Infection' },
    { name: 'Urine Culture', category: 'Infection' },
    { name: 'Stool Culture', category: 'Infection' },
    { name: 'Dengue NS1', category: 'Serology' },
    { name: 'Dengue IgG', category: 'Serology' },
    { name: 'Dengue IgM', category: 'Serology' },
    { name: 'Malaria Parasite Test', category: 'Serology' },
    { name: 'Widal Test', category: 'Serology' },
    { name: 'HBsAg', category: 'Serology' },
    { name: 'Anti-HCV', category: 'Serology' },
    { name: 'HIV 1 & 2', category: 'Serology' },
    { name: 'VDRL', category: 'Serology' },
    { name: 'TPHA', category: 'Serology' },
    { name: 'COVID-19 RT-PCR', category: 'Serology' },
    { name: 'COVID-19 Antibody', category: 'Serology' },
    { name: 'Typhoid IgM', category: 'Serology' },
    { name: 'Leptospira IgM', category: 'Serology' },
    { name: 'Chikungunya IgM', category: 'Serology' },

    // 🧬 6️⃣ Thyroid & Hormone Tests
    { name: 'Thyroid Function Test', category: 'Thyroid' },
    { name: 'T3', category: 'Thyroid' },
    { name: 'T4', category: 'Thyroid' },
    { name: 'TSH', category: 'Thyroid' },
    { name: 'Free T3', category: 'Thyroid' },
    { name: 'Free T4', category: 'Thyroid' },
    { name: 'Anti-TPO', category: 'Thyroid' },
    { name: 'Anti-Thyroglobulin', category: 'Thyroid' },
    { name: 'FSH', category: 'Hormone' },
    { name: 'LH', category: 'Hormone' },
    { name: 'Testosterone', category: 'Hormone' },
    { name: 'Free Testosterone', category: 'Hormone' },
    { name: 'Estrogen', category: 'Hormone' },
    { name: 'Progesterone', category: 'Hormone' },
    { name: 'Prolactin', category: 'Hormone' },
    { name: 'AMH', category: 'Hormone' },
    { name: 'Beta hCG', category: 'Hormone' },
    { name: 'Cortisol', category: 'Hormone' },
    { name: 'DHEA-S', category: 'Hormone' },
    { name: 'Parathyroid Hormone', category: 'Hormone' },

    // 🧬 7️⃣ Vitamin & Nutritional Tests
    { name: 'Vitamin D (25-OH)', category: 'Vitamin' },
    { name: 'Vitamin B12', category: 'Vitamin' },
    { name: 'Iron', category: 'Nutritional' },
    { name: 'Ferritin', category: 'Nutritional' },
    { name: 'TIBC', category: 'Nutritional' },
    { name: 'Transferrin', category: 'Nutritional' },
    { name: 'Folate', category: 'Nutritional' },
    { name: 'Zinc', category: 'Nutritional' },
    { name: 'Copper', category: 'Nutritional' },
    { name: 'Selenium', category: 'Nutritional' },

    // 🧪 8️⃣ Urine & Stool Tests
    { name: 'Urine Routine', category: 'Urine' },
    { name: 'Urine Microscopy', category: 'Urine' },
    { name: 'Urine Protein', category: 'Urine' },
    { name: 'Urine Ketones', category: 'Urine' },
    { name: 'Urine Sugar', category: 'Urine' },
    { name: 'Urine Pregnancy Test', category: 'Urine' },
    { name: 'Stool Routine', category: 'Stool' },
    { name: 'Stool Occult Blood', category: 'Stool' },
    { name: 'Stool Ova & Parasite', category: 'Stool' },

    // ❤️ 9️⃣ Cardiac Markers
    { name: 'Troponin I', category: 'Cardiac' },
    { name: 'Troponin T', category: 'Cardiac' },
    { name: 'CK-MB', category: 'Cardiac' },
    { name: 'LDH', category: 'Cardiac' },
    { name: 'NT-proBNP', category: 'Cardiac' },
    { name: 'Myoglobin', category: 'Cardiac' },
    { name: 'Homocysteine', category: 'Cardiac' },

    // 🧬 🔟 Autoimmune Tests
    { name: 'ANA', category: 'Autoimmune' },
    { name: 'Anti-dsDNA', category: 'Autoimmune' },
    { name: 'Rheumatoid Factor', category: 'Autoimmune' },
    { name: 'Anti-CCP', category: 'Autoimmune' },
    { name: 'ASO Titre', category: 'Autoimmune' },
    { name: 'HLA-B27', category: 'Autoimmune' },
    { name: 'Anti-Cardiolipin Antibody', category: 'Autoimmune' },
    { name: 'Lupus Anticoagulant', category: 'Autoimmune' },

    // Respiratory & Pulmonary Tests
    { name: 'Spirometry', category: 'Respiratory' },
    { name: 'Peak Flow Rate', category: 'Respiratory' },
    { name: 'Arterial Blood Gas (ABG)', category: 'Respiratory' },
    { name: 'Oxygen Saturation', category: 'Respiratory' },
    { name: 'Sputum Examination', category: 'Respiratory' },
    { name: 'Sputum Culture', category: 'Respiratory' },
    { name: 'Sputum AFB', category: 'Respiratory' },
    { name: 'Mantoux Test', category: 'Respiratory' },
    { name: 'Bronchoscopy', category: 'Respiratory' },

    // Neurology Tests
    { name: 'Electroencephalogram (EEG)', category: 'Neurology' },
    { name: 'Nerve Conduction Study', category: 'Neurology' },
    { name: 'Electromyography (EMG)', category: 'Neurology' },
    { name: 'Cerebrospinal Fluid Analysis', category: 'Neurology' },
    { name: 'CSF Culture', category: 'Neurology' },
    { name: 'CSF Protein', category: 'Neurology' },
    { name: 'CSF Glucose', category: 'Neurology' },
    { name: 'Acetylcholine Receptor Antibody', category: 'Neurology' },
    { name: 'Oligoclonal Bands', category: 'Neurology' },

    // Imaging Tests
    { name: 'Electrocardiogram (ECG)', category: 'Cardiology' },
    { name: '2D Echocardiography', category: 'Cardiology' },
    { name: 'TMT (Stress Test)', category: 'Cardiology' },
    { name: 'Holter Monitoring', category: 'Cardiology' },
    { name: 'Coronary Angiography', category: 'Cardiology' },
    { name: 'CT Scan', category: 'Imaging' },
    { name: 'MRI', category: 'Imaging' },
    { name: 'Ultrasound Abdomen', category: 'Imaging' },
    { name: 'X-Ray Chest', category: 'Imaging' },
    { name: 'Doppler Study', category: 'Imaging' },

    // Bone & Joint
    { name: 'Bone Mineral Density (DEXA)', category: 'Bone & Joint' },
    { name: 'Synovial Fluid Analysis', category: 'Bone & Joint' },

    // Cancer & Tumor
    { name: 'PSA', category: 'Cancer' },
    { name: 'CA-125', category: 'Cancer' },
    { name: 'CA 19-9', category: 'Cancer' },
    { name: 'CEA', category: 'Cancer' },
    { name: 'AFP', category: 'Cancer' },
    { name: 'Beta-2 Microglobulin', category: 'Cancer' },
    { name: 'Thyroglobulin', category: 'Cancer' },
    { name: 'Calcitonin', category: 'Cancer' },
    { name: 'BRCA Mutation Test', category: 'Cancer' }
];

async function seedData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing tests from MongoDB
        await DiagnosticTestCatalog.deleteMany({});
        console.log('🗑️  Cleared existing diagnostic tests from MongoDB');

        // Insert into MongoDB
        const createdTests = await DiagnosticTestCatalog.insertMany(diagnosticTests);
        console.log(`✅ Seeded ${createdTests.length} tests in MongoDB`);

        // Typesense Schema
        const schema = {
            name: 'diagnostic_tests',
            fields: [
                { name: 'name', type: 'string', facet: false },
                { name: 'category', type: 'string', facet: true }
            ]
        };

        // Clear Typesense
        try {
            await typesenseClient.collections('diagnostic_tests').delete();
            console.log('🗑️  Deleted existing diagnostic_tests collection in Typesense');
        } catch (err) {
            // Collection might not exist
        }

        // Create Typesense Collection
        await typesenseClient.collections().create(schema);
        console.log('✅ Created diagnostic_tests collection in Typesense');

        // Format for Typesense
        const typesenseDocs = createdTests.map(test => ({
            id: test._id.toString(),
            name: test.name,
            category: test.category
        }));

        // Import into Typesense
        await typesenseClient.collections('diagnostic_tests').documents().import(typesenseDocs);
        console.log(`✅ Imported ${typesenseDocs.length} tests into Typesense`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedData();
