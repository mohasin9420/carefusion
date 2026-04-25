const User = require('../models/User');

/**
 * Creates a default admin account if it doesn't exist
 * This ensures there's always a super admin for system access
 */
async function createDefaultAdmin() {
    try {
        const defaultAdminEmail = 'admin@carefusion.com';

        // Check if default admin already exists
        const existingAdmin = await User.findOne({ email: defaultAdminEmail });

        if (existingAdmin) {
            console.log('✅ Default admin account already exists');
            return;
        }

        // Default password (will be hashed by User model's pre-save hook)
        const defaultPassword = 'Admin@123';

        // Create the default admin user
        await User.create({
            email: defaultAdminEmail,
            password: defaultPassword,
            role: 'admin',
            status: 'approved',
            isDefaultAdmin: true // Flag to identify this as the permanent admin
        });

        console.log('✅ Default admin account created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email: admin@carefusion.com');
        console.log('🔑 Password: Admin@123');
        console.log('⚠️  IMPORTANT: Change this password after first login!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('❌ Error creating default admin:', error.message);
    }
}

module.exports = createDefaultAdmin;
