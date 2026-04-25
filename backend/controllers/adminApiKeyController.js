const HospitalConfig = require('../models/HospitalConfig');

const getOrCreateConfig = async () => {
    let config = await HospitalConfig.findOne();
    if (!config) {
        config = await HospitalConfig.create({ hospitalName: 'Hospital' });
    }
    return config;
};

const maskKey = (key) => {
    if (!key || key.length < 8) return '••••••••';
    return '••••••••' + key.slice(-4);
};

// @desc    Get all API keys (masked values)
// @route   GET /api/admin/config/api-keys
// @access  Private/Admin
exports.getApiKeys = async (req, res) => {
    try {
        const config = await getOrCreateConfig();
        const keys = (config.apiKeys || []).map(k => ({
            _id: k._id,
            provider: k.provider,
            keyLabel: k.keyLabel,
            keyValueMasked: maskKey(k.keyValue),
            isActive: k.isActive,
            addedAt: k.addedAt
        }));
        res.json(keys);
    } catch (error) {
        console.error('getApiKeys error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add a new API key
// @route   POST /api/admin/config/api-keys
// @access  Private/Admin
exports.addApiKey = async (req, res) => {
    try {
        const { provider, keyLabel, keyValue } = req.body;
        if (!provider || !keyLabel || !keyValue) {
            return res.status(400).json({ message: 'Provider, label, and API key are required' });
        }
        const config = await getOrCreateConfig();
        config.apiKeys.push({ provider, keyLabel, keyValue, isActive: true });
        await config.save();
        const newKey = config.apiKeys[config.apiKeys.length - 1];
        res.status(201).json({
            message: 'API key added successfully',
            key: { _id: newKey._id, provider: newKey.provider, keyLabel: newKey.keyLabel, keyValueMasked: maskKey(newKey.keyValue), isActive: newKey.isActive, addedAt: newKey.addedAt }
        });
    } catch (error) {
        console.error('addApiKey error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update an API key
// @route   PUT /api/admin/config/api-keys/:keyId
// @access  Private/Admin
exports.updateApiKey = async (req, res) => {
    try {
        const config = await getOrCreateConfig();
        const key = config.apiKeys.id(req.params.keyId);
        if (!key) return res.status(404).json({ message: 'API key not found' });

        const { keyLabel, keyValue, isActive } = req.body;
        if (keyLabel !== undefined) key.keyLabel = keyLabel;
        if (keyValue && keyValue !== maskKey(key.keyValue)) key.keyValue = keyValue;
        if (isActive !== undefined) key.isActive = isActive;
        await config.save();
        res.json({ message: 'API key updated successfully' });
    } catch (error) {
        console.error('updateApiKey error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete an API key
// @route   DELETE /api/admin/config/api-keys/:keyId
// @access  Private/Admin
exports.deleteApiKey = async (req, res) => {
    try {
        const config = await getOrCreateConfig();
        const key = config.apiKeys.id(req.params.keyId);
        if (!key) return res.status(404).json({ message: 'API key not found' });
        key.deleteOne();
        await config.save();
        res.json({ message: 'API key deleted successfully' });
    } catch (error) {
        console.error('deleteApiKey error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Test an API key by making a minimal call
// @route   POST /api/admin/config/api-keys/:keyId/test
// @access  Private/Admin
exports.testApiKey = async (req, res) => {
    try {
        const config = await getOrCreateConfig();
        const key = config.apiKeys.id(req.params.keyId);
        if (!key) return res.status(404).json({ message: 'API key not found' });

        if (key.provider === 'gemini') {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${key.keyValue}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
            );
            if (!response.ok) {
                const err = await response.json();
                return res.status(400).json({ message: 'API key test failed: ' + (err.error?.message || 'Invalid key') });
            }
            return res.json({ message: '✅ Gemini API key is valid and working!' });
        }

        if (key.provider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${key.keyValue}` }
            });
            if (!response.ok) {
                return res.status(400).json({ message: 'OpenAI API key test failed. Please check the key.' });
            }
            return res.json({ message: '✅ OpenAI API key is valid and working!' });
        }

        if (key.provider === 'groq') {
            const response = await fetch('https://api.groq.com/openai/v1/models', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${key.keyValue}` }
            });
            if (!response.ok) {
                return res.status(400).json({ message: 'Groq API key test failed. Please check the key.' });
            }
            return res.json({ message: '✅ Groq API key is valid and working!' });
        }

        if (key.provider === 'mistral') {
            const response = await fetch('https://api.mistral.ai/v1/models', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${key.keyValue}` }
            });
            if (!response.ok) {
                return res.status(400).json({ message: 'Mistral API key test failed. Please check the key.' });
            }
            return res.json({ message: '✅ Mistral API key is valid and working!' });
        }

        res.json({ message: `✅ API key saved for provider "${key.provider}". Live test not yet available for this provider.` });
    } catch (error) {
        console.error('testApiKey error:', error);
        res.status(500).json({ message: 'Error testing API key: ' + error.message });
    }
};

// @desc    Get the active API key value for a given provider (internal use)
exports.getActiveKeyForProvider = async (provider) => {
    const config = await HospitalConfig.findOne().select('apiKeys').lean();
    if (!config || !config.apiKeys) return null;
    const key = config.apiKeys.find(k => k.provider === provider && k.isActive);
    return key ? key.keyValue : null;
};
