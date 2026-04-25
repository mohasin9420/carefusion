const typesenseClient = require('../config/typesense');
const DiagnosticTestCatalog = require('../models/DiagnosticTestCatalog');

// Search lab tests using Typesense (ultra-fast with typo tolerance)
exports.searchLabTests = async (req, res) => {
    try {
        const { q, limit = 10, category } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                message: 'Search query must be at least 2 characters'
            });
        }

        const searchQuery = q.trim();

        // Build search parameters
        const searchParams = {
            q: searchQuery,
            query_by: 'name,category,description',
            per_page: parseInt(limit),
            typo_tokens_threshold: 1,
            num_typos: 2,
            prefix: true,
            prioritize_exact_match: true,
            sort_by: 'sort_order:asc'
        };

        // Add category filter if provided
        if (category) {
            searchParams.filter_by = `category:=${category}`;
        }

        // Search with Typesense
        const searchResults = await typesenseClient
            .collections('labtests')
            .documents()
            .search(searchParams);

        // Transform results to match frontend expectations
        const labTests = searchResults.hits.map(hit => ({
            _id: hit.document.id,
            name: hit.document.name,
            category: hit.document.category,
            description: hit.document.description
        }));

        res.json({
            success: true,
            count: labTests.length,
            data: labTests,
            searchTime: searchResults.search_time_ms
        });

    } catch (error) {
        console.error('Typesense search error:', error);

        // Fallback to MongoDB if Typesense is down
        try {
            console.log('⚠️  Typesense unavailable, falling back to MongoDB');

            const query = {
                name: new RegExp(q, 'i')
            };

            if (category) {
                query.category = category;
            }

            const labTests = await DiagnosticTestCatalog.find(query)
                .sort({ name: 1 })
                .limit(parseInt(limit))
                .select('name category description');

            res.json({
                success: true,
                count: labTests.length,
                data: labTests,
                fallback: true
            });
        } catch (fallbackError) {
            res.status(500).json({
                message: 'Error searching lab tests',
                error: fallbackError.message
            });
        }
    }
};

// Get lab test details by ID
exports.getLabTestById = async (req, res) => {
    try {
        const labTest = await DiagnosticTestCatalog.findById(req.params.id);

        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        res.json({
            success: true,
            data: labTest
        });

    } catch (error) {
        console.error('Get lab test error:', error);
        res.status(500).json({ message: 'Error fetching lab test details', error: error.message });
    }
};

// Get lab test catalog (paginated)
exports.getLabTestCatalog = async (req, res) => {
    try {
        const { page = 1, limit = 50, category } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (category) {
            query.category = category;
        }

        const labTests = await DiagnosticTestCatalog.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('name category description');

        const total = await DiagnosticTestCatalog.countDocuments(query);

        res.json({
            success: true,
            data: labTests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get catalog error:', error);
        res.status(500).json({ message: 'Error fetching lab test catalog', error: error.message });
    }
};

// Get lab test by exact name
exports.getLabTestByName = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Lab test name is required' });
        }

        const labTest = await DiagnosticTestCatalog.findOne({
            name: new RegExp(`^${name}$`, 'i')
        });

        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        res.json({
            success: true,
            data: labTest
        });

    } catch (error) {
        console.error('Get lab test by name error:', error);
        res.status(500).json({ message: 'Error fetching lab test', error: error.message });
    }
};

// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await DiagnosticTestCatalog.distinct('category');

        res.json({
            success: true,
            data: categories.sort()
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
};
