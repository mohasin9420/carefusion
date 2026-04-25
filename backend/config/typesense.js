const Typesense = require('typesense');

// Initialize Typesense client
const typesenseClient = new Typesense.Client({
    nodes: [{
        host: process.env.TYPESENSE_HOST || 'localhost',
        port: process.env.TYPESENSE_PORT || 8108,
        protocol: process.env.TYPESENSE_PROTOCOL || 'http'
    }],
    apiKey: process.env.TYPESENSE_API_KEY || 'hospital_typesense_secret_key_2024',
    connectionTimeoutSeconds: 2
});

module.exports = typesenseClient;
