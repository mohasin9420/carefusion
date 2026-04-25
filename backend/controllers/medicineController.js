const typesenseClient = require('../config/typesense');
const MedicineCatalog = require('../models/MedicineCatalog');

// Search medicines using Typesense (ultra-fast with typo tolerance)
exports.searchMedicines = async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                message: 'Search query must be at least 2 characters'
            });
        }

        const searchQuery = q.trim();

        // Search with Typesense
        const searchResults = await typesenseClient
            .collections('medicines')
            .documents()
            .search({
                q: searchQuery,
                query_by: 'name,manufacturer,saltComposition',
                per_page: parseInt(limit),
                filter_by: 'isDiscontinued:=false',
                typo_tokens_threshold: 1, // Enable typo tolerance for queries with 1+ tokens
                num_typos: 2, // Allow up to 2 typos per word
                prefix: true, // Enable prefix matching for autocomplete
                prioritize_exact_match: true, // Exact matches ranked higher
                sort_by: 'prescribeCount:desc' // Sort by popularity
            });

        // Transform results to match frontend expectations
        const medicines = searchResults.hits.map(hit => ({
            _id: hit.document.id,
            name: hit.document.name,
            manufacturer: hit.document.manufacturer,
            price: hit.document.price,
            saltComposition: hit.document.saltComposition,
            prescribeCount: hit.document.prescribeCount
        }));

        res.json({
            success: true,
            count: medicines.length,
            data: medicines,
            searchTime: searchResults.search_time_ms // Typesense search time
        });

    } catch (error) {
        console.error('Typesense search error:', error);

        // Fallback to MongoDB if Typesense is down
        try {
            console.log('⚠️  Typesense unavailable, falling back to MongoDB');

            const medicines = await MedicineCatalog.find(
                {
                    $text: { $search: q },
                    isDiscontinued: { $ne: true }
                },
                { score: { $meta: 'textScore' } }
            )
                .sort({
                    prescribeCount: -1, // Sort by popularity first
                    score: { $meta: 'textScore' }
                })
                .limit(parseInt(limit))
                .select('name manufacturer price saltComposition prescribeCount');

            res.json({
                success: true,
                count: medicines.length,
                data: medicines,
                fallback: true
            });
        } catch (fallbackError) {
            res.status(500).json({
                message: 'Error searching medicines',
                error: fallbackError.message
            });
        }
    }
};

// Get medicine details by ID
exports.getMedicineById = async (req, res) => {
    try {
        const medicine = await MedicineCatalog.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        res.json({
            success: true,
            data: medicine
        });

    } catch (error) {
        console.error('Get medicine error:', error);
        res.status(500).json({ message: 'Error fetching medicine details', error: error.message });
    }
};

// Get medicine catalog (paginated browse)
exports.getMedicineCatalog = async (req, res) => {
    try {
        const { page = 1, limit = 50, manufacturer } = req.query;
        const skip = (page - 1) * limit;

        const query = { isDiscontinued: { $ne: true } };
        if (manufacturer) {
            query.manufacturer = new RegExp(manufacturer, 'i');
        }

        const medicines = await MedicineCatalog.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('name manufacturer price saltComposition');

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
        console.error('Get catalog error:', error);
        res.status(500).json({ message: 'Error fetching medicine catalog', error: error.message });
    }
};

// Get medicine by exact name (for prescription validation)
exports.getMedicineByName = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Medicine name is required' });
        }

        const medicine = await MedicineCatalog.findOne({
            name: new RegExp(`^${name}$`, 'i'),
            isDiscontinued: { $ne: true }
        });

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        res.json({
            success: true,
            data: medicine
        });

    } catch (error) {
        console.error('Get medicine by name error:', error);
        res.status(500).json({ message: 'Error fetching medicine', error: error.message });
    }
};
