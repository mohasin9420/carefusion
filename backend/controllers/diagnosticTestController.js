const typesenseClient = require('../config/typesense');
const DiagnosticTestCatalog = require('../models/DiagnosticTestCatalog');

// @desc    Search diagnostic tests via TypeSense
// @route   GET /api/diagnostic-tests/search
// @access  Private
exports.searchTests = async (req, res) => {
    try {
        const { q = '', limit = 10 } = req.query;

        if (!q || q.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const searchResults = await typesenseClient
            .collections('diagnostic_tests')
            .documents()
            .search({
                q,
                query_by: 'name,category',
                per_page: parseInt(limit),
                typo_tokens_threshold: 1,
                num_typos: 2
            });

        const formattedResults = searchResults.hits.map(hit => ({
            _id: hit.document.id,
            name: hit.document.name,
            category: hit.document.category
        }));

        res.json({
            success: true,
            data: formattedResults
        });
    } catch (error) {
        console.error('TypeSense search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed'
        });
    }
};

// @desc    Get all diagnostic tests (paginated)
// @route   GET /api/diagnostic-tests
// @access  Private
exports.getAllTests = async (req, res) => {
    try {
        const { page = 1, limit = 20, category } = req.query;
        const query = category ? { category } : {};

        const tests = await DiagnosticTestCatalog.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ name: 1 })
            .lean();

        const count = await DiagnosticTestCatalog.countDocuments(query);

        res.json({
            success: true,
            data: tests,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new diagnostic test (Staff/Admin/Laboratory)
// @route   POST /api/diagnostic-tests
// @access  Private (Staff/Admin/Laboratory)
exports.createTest = async (req, res) => {
    try {
        const { name, category, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Test name is required'
            });
        }

        const test = await DiagnosticTestCatalog.create({
            name,
            category,
            description
        });

        // Sync to TypeSense (with error handling)
        try {
            await typesenseClient.collections('diagnostic_tests').documents().create({
                id: test._id.toString(),
                name: test.name,
                category: test.category || 'General'
            });
            console.log(`✅ Test synced to Typesense: ${test.name}`);
        } catch (typesenseError) {
            console.error('⚠️  Typesense sync failed:', typesenseError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Diagnostic test created successfully',
            data: test
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update diagnostic test
// @route   PUT /api/diagnostic-tests/:id
// @access  Private (Admin/Staff/Laboratory)
exports.updateTest = async (req, res) => {
    try {
        const { name, category, description } = req.body;

        const test = await DiagnosticTestCatalog.findById(req.params.id);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Diagnostic test not found'
            });
        }

        if (name) test.name = name;
        if (category) test.category = category;
        if (description) test.description = description;

        await test.save();

        // Update in Typesense
        try {
            await typesenseClient
                .collections('diagnostic_tests')
                .documents(test._id.toString())
                .update({
                    name: test.name,
                    category: test.category || 'General'
                });
            console.log(`✅ Test updated in Typesense: ${test.name}`);
        } catch (typesenseError) {
            console.error('⚠️  Typesense update failed:', typesenseError.message);
        }

        res.json({
            success: true,
            message: 'Diagnostic test updated successfully',
            data: test
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete diagnostic test
// @route   DELETE /api/diagnostic-tests/:id
// @access  Private (Admin)
exports.deleteTest = async (req, res) => {
    try {
        const test = await DiagnosticTestCatalog.findById(req.params.id);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Diagnostic test not found'
            });
        }

        await test.deleteOne();

        // Delete from Typesense
        try {
            await typesenseClient
                .collections('diagnostic_tests')
                .documents(test._id.toString())
                .delete();
            console.log(`✅ Test deleted from Typesense: ${test.name}`);
        } catch (typesenseError) {
            console.error('⚠️  Typesense deletion failed:', typesenseError.message);
        }

        res.json({
            success: true,
            message: 'Diagnostic test deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get diagnostic test by ID
// @route   GET /api/diagnostic-tests/:id
// @access  Private
exports.getTestById = async (req, res) => {
    try {
        const test = await DiagnosticTestCatalog.findById(req.params.id);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Diagnostic test not found'
            });
        }

        res.json({
            success: true,
            data: test
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
