const MedicineCatalog = require('../models/MedicineCatalog');
const typesenseClient = require('../config/typesense');

// @desc    Create new medicine in catalog
// @route   POST /api/medicines
// @access  Private (Admin, Pharmacy, Laboratory)
exports.createMedicine = async (req, res) => {
    try {
        const {
            name,
            manufacturer,
            price,
            saltComposition,
            uses,
            sideEffects,
            howToUse
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Medicine name is required'
            });
        }

        // Check if medicine already exists
        const existingMedicine = await MedicineCatalog.findOne({
            name: new RegExp(`^${name}$`, 'i')
        });

        if (existingMedicine) {
            return res.status(400).json({
                success: false,
                message: 'Medicine with this name already exists'
            });
        }

        // Create medicine in MongoDB
        const medicine = await MedicineCatalog.create({
            name,
            manufacturer,
            price,
            saltComposition,
            uses,
            sideEffects,
            howToUse,
            prescribeCount: 0
        });

        // Sync to Typesense (with error handling)
        try {
            await typesenseClient
                .collections('medicines')
                .documents()
                .create({
                    id: medicine._id.toString(),
                    name: medicine.name,
                    manufacturer: medicine.manufacturer || '',
                    price: medicine.price || 0,
                    saltComposition: medicine.saltComposition || '',
                    prescribeCount: medicine.prescribeCount || 0,
                    isDiscontinued: medicine.isDiscontinued || false
                });
            console.log(`✅ Medicine synced to Typesense: ${medicine.name}`);
        } catch (typesenseError) {
            console.error('⚠️  Typesense sync failed:', typesenseError.message);
            // Continue - medicine is still created in MongoDB
        }

        res.status(201).json({
            success: true,
            message: 'Medicine added to catalog successfully',
            data: medicine
        });

    } catch (error) {
        console.error('Create medicine error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding medicine to catalog',
            error: error.message
        });
    }
};

// @desc    Update medicine in catalog
// @route   PUT /api/medicines/:id
// @access  Private (Admin, Pharmacy)
exports.updateMedicine = async (req, res) => {
    try {
        const {
            name,
            manufacturer,
            price,
            saltComposition,
            uses,
            sideEffects,
            howToUse
        } = req.body;

        const medicine = await MedicineCatalog.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        // Update fields
        if (name) medicine.name = name;
        if (manufacturer) medicine.manufacturer = manufacturer;
        if (price !== undefined) medicine.price = price;
        if (saltComposition) medicine.saltComposition = saltComposition;
        if (uses) medicine.uses = uses;
        if (sideEffects) medicine.sideEffects = sideEffects;
        if (howToUse) medicine.howToUse = howToUse;

        await medicine.save();

        // Update in Typesense
        try {
            await typesenseClient
                .collections('medicines')
                .documents(medicine._id.toString())
                .update({
                    name: medicine.name,
                    manufacturer: medicine.manufacturer || '',
                    price: medicine.price || 0,
                    saltComposition: medicine.saltComposition || '',
                    prescribeCount: medicine.prescribeCount || 0,
                    isDiscontinued: medicine.isDiscontinued || false
                });
            console.log(`✅ Medicine updated in Typesense: ${medicine.name}`);
        } catch (typesenseError) {
            console.error('⚠️  Typesense update failed:', typesenseError.message);
        }

        res.json({
            success: true,
            message: 'Medicine updated successfully',
            data: medicine
        });

    } catch (error) {
        console.error('Update medicine error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating medicine',
            error: error.message
        });
    }
};

// @desc    Mark medicine as discontinued
// @route   DELETE /api/medicines/:id
// @access  Private (Admin)
exports.discontinueMedicine = async (req, res) => {
    try {
        const medicine = await MedicineCatalog.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        medicine.isDiscontinued = true;
        await medicine.save();

        // Update in Typesense
        try {
            await typesenseClient
                .collections('medicines')
                .documents(medicine._id.toString())
                .update({
                    isDiscontinued: true
                });
            console.log(`✅ Medicine discontinued in Typesense: ${medicine.name}`);
        } catch (typesenseError) {
            console.error('⚠️  Typesense update failed:', typesenseError.message);
        }

        res.json({
            success: true,
            message: 'Medicine marked as discontinued',
            data: medicine
        });

    } catch (error) {
        console.error('Discontinue medicine error:', error);
        res.status(500).json({
            success: false,
            message: 'Error discontinuing medicine',
            error: error.message
        });
    }
};

// @desc    Get all medicines (paginated, with filters)
// @route   GET /api/medicines/all
// @access  Private (Admin, Pharmacy, Laboratory)
exports.getAllMedicines = async (req, res) => {
    try {
        const { page = 1, limit = 50, manufacturer, includeDiscontinued = 'false' } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (includeDiscontinued !== 'true') {
            query.isDiscontinued = { $ne: true };
        }
        if (manufacturer) {
            query.manufacturer = new RegExp(manufacturer, 'i');
        }

        const medicines = await MedicineCatalog.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await MedicineCatalog.countDocuments(query);

        res.json({
            success: true,
            data: medicines,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get all medicines error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching medicines',
            error: error.message
        });
    }
};
