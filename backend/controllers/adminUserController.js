const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Pharmacy = require('../models/Pharmacy');
const Laboratory = require('../models/Laboratory');
const AuditLog = require('../models/AuditLog');

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        const { role, status, search } = req.query;

        const query = {};
        if (role) query.role = role;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            name,
            role,
            status: 'approved' // Admin-created users are auto-approved
        });

        // Log the action
        await AuditLog.create({
            userId: req.user._id,
            action: 'user_created',
            category: 'user_management',
            severity: 'medium',
            description: `Created new ${role} user: ${email}`,
            targetResource: {
                resourceType: 'user',
                resourceId: user._id
            }
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const allowedUpdates = ['name', 'email', 'role', 'status'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        Object.assign(user, updates);
        await user.save();

        // Log the action
        await AuditLog.create({
            userId: req.user._id,
            action: 'user_updated',
            category: 'user_management',
            severity: 'medium',
            description: `Updated user: ${user.email}`,
            metadata: { updates },
            targetResource: {
                resourceType: 'user',
                resourceId: user._id
            }
        });

        res.json({
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.deleteOne();

        // Log the action
        await AuditLog.create({
            userId: req.user._id,
            action: 'user_deleted',
            category: 'user_management',
            severity: 'high',
            description: `Deleted user: ${user.email}`,
            targetResource: {
                resourceType: 'user',
                resourceId: user._id
            }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Approve user account
// @route   PUT /api/admin/users/:id/approve
// @access  Private/Admin
exports.approveUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = 'approved';
        await user.save();

        // Log the action
        await AuditLog.create({
            userId: req.user._id,
            action: 'user_approved',
            category: 'user_management',
            severity: 'medium',
            description: `Approved user: ${user.email}`,
            targetResource: {
                resourceType: 'user',
                resourceId: user._id
            }
        });

        res.json({
            message: 'User approved successfully',
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Block/Suspend user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
exports.blockUser = async (req, res) => {
    try {
        const { action, reason } = req.body; // action: 'block' or 'suspend'

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (action === 'block') {
            user.status = 'blocked';
        } else if (action === 'suspend') {
            user.status = 'suspended';
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        await user.save();

        // Log the action
        await AuditLog.create({
            userId: req.user._id,
            action: action === 'block' ? 'user_blocked' : 'user_suspended',
            category: 'user_management',
            severity: 'high',
            description: `${action === 'block' ? 'Blocked' : 'Suspended'} user: ${user.email}. Reason: ${reason}`,
            metadata: { reason },
            targetResource: {
                resourceType: 'user',
                resourceId: user._id
            }
        });

        res.json({
            message: `User ${action === 'block' ? 'blocked' : 'suspended'} successfully`,
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Change user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.changeUserRole = async (req, res) => {
    try {
        const { newRole } = req.body;

        const validRoles = ['patient', 'doctor', 'pharmacy', 'laboratory', 'admin'];
        if (!validRoles.includes(newRole)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const oldRole = user.role;
        user.role = newRole;
        await user.save();

        // Log the action
        await AuditLog.create({
            userId: req.user._id,
            action: 'role_changed',
            category: 'user_management',
            severity: 'high',
            description: `Changed user role from ${oldRole} to ${newRole} for: ${user.email}`,
            metadata: { oldRole, newRole },
            targetResource: {
                resourceType: 'user',
                resourceId: user._id
            }
        });

        res.json({
            message: 'Role changed successfully',
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// All functions already exported via exports.functionName above
