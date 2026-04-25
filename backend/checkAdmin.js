const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carefusion')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// User Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    role: String,
    status: String,
    createdBy: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function checkAndFixAdmin() {
    try {
        console.log('\n🔍 Checking admin accounts...\n');

        // Find all admin users
        const adminUsers = await User.find({ role: 'admin' });

        console.log(`Found ${adminUsers.length} admin account(s):\n`);
        adminUsers.forEach((admin, index) => {
            console.log(`${index + 1}. Email: ${admin.email}`);
            console.log(`   Status: ${admin.status}`);
            console.log(`   Created: ${admin.createdAt}`);
            console.log('');
        });

        // Remove all existing admin accounts
        console.log('🗑️  Removing all existing admin accounts...');
        await User.deleteMany({ role: 'admin' });
        console.log('✅ All admin accounts removed\n');

        // Create fresh default admin
        const defaultPassword = 'Admin@123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const newAdmin = await User.create({
            email: 'admin@carefusion.com',
            password: hashedPassword,
            role: 'admin',
            status: 'approved'
        });

        console.log('✅ New default admin created successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email: admin@carefusion.com');
        console.log('🔑 Password: Admin@123');
        console.log('👤 Role: admin');
        console.log('✓  Status: approved');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Test password verification
        const testPassword = await bcrypt.compare('Admin@123', newAdmin.password);
        console.log(`🧪 Password verification test: ${testPassword ? '✅ PASSED' : '❌ FAILED'}\n`);

        console.log('✅ Admin account is ready to use!');
        console.log('🌐 Login at: http://localhost:5173/login');
        console.log('   Select Role: Admin');
        console.log('   Email: admin@carefusion.com');
        console.log('   Password: Admin@123\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAndFixAdmin();
