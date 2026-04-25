const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ms')
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Delete all users to force recreation
        const result = await mongoose.connection.db.collection('users').deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} user(s)`);

        console.log('⚠️  Please restart the backend server to recreate the admin account');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });
