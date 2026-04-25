const Department = require('../models/Department');
const Doctor = require('../models/Doctor');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res) => {
    try {
        const departments = await Department.find({ isActive: true })
            .populate('headId', 'fullName specialization')
            .sort({ name: 1 });
        res.json(departments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create department (Admin)
// @route   POST /api/departments
// @access  Private/Admin
exports.createDepartment = async (req, res) => {
    try {
        const { name, code, description, floor, contactExt } = req.body;
        const dept = await Department.create({
            name,
            code: code || name.slice(0, 3).toUpperCase(),
            description,
            floor,
            contactExt
        });
        res.status(201).json(dept);
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Department with this name/code already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update department (Admin)
// @route   PUT /api/departments/:id
// @access  Private/Admin
exports.updateDepartment = async (req, res) => {
    try {
        const dept = await Department.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!dept) return res.status(404).json({ message: 'Department not found' });
        res.json(dept);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Assign department head (Admin)
// @route   PUT /api/departments/:id/head
// @access  Private/Admin
exports.assignDepartmentHead = async (req, res) => {
    try {
        const { doctorId } = req.body;
        const dept = await Department.findByIdAndUpdate(
            req.params.id,
            { headId: doctorId },
            { new: true }
        ).populate('headId', 'fullName specialization');
        if (!dept) return res.status(404).json({ message: 'Department not found' });
        res.json(dept);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
