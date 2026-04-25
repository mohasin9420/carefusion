const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const AuditLog = require('../models/AuditLog');

// @desc    Create department
// @route   POST /api/admin/departments
// @access  Private/Admin
exports.createDepartment = async (req, res) => {
    try {
        const { name, code, description, contactNumber, email, location, workingHours } = req.body;

        const departmentExists = await Department.findOne({ $or: [{ name }, { code }] });
        if (departmentExists) {
            return res.status(400).json({ message: 'Department with this name or code already exists' });
        }

        const department = await Department.create({
            name,
            code,
            description,
            contactNumber,
            email,
            location,
            workingHours
        });

        // Log the action
        await AuditLog.create({
            userId: req.user._id,
            action: 'department_created',
            category: 'configuration',
            severity: 'medium',
            description: `Created department: ${name}`,
            targetResource: {
                resourceType: 'department',
                resourceId: department._id
            }
        });

        res.status(201).json({
            message: 'Department created successfully',
            department
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all departments
// @route   GET /api/admin/departments
// @access  Private/Admin
exports.getDepartments = async (req, res) => {
    try {
        const { status } = req.query;

        const query = status ? { status } : {};

        const departments = await Department.find(query)
            .populate('headOfDepartment', 'fullName specialization')
            .populate('doctors', 'fullName specialization')
            .populate('staff.userId', 'name email')
            .sort({ name: 1 });

        res.json(departments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update department
// @route   PUT /api/admin/departments/:id
// @access  Private/Admin
exports.updateDepartment = async (req, res) => {
    try {
        const department = await Department.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Log the action
        await AuditLog.create({
            userId: req.user._id,
            action: 'department_modified',
            category: 'configuration',
            severity: 'medium',
            description: `Updated department: ${department.name}`,
            targetResource: {
                resourceType: 'department',
                resourceId: department._id
            }
        });

        res.json({
            message: 'Department updated successfully',
            department
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Assign doctor to department
// @route   PUT /api/admin/departments/:id/assign-doctor
// @access  Private/Admin
exports.assignDoctorToDepartment = async (req, res) => {
    try {
        const { doctorId } = req.body;

        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Check if doctor already assigned
        if (department.doctors.includes(doctorId)) {
            return res.status(400).json({ message: 'Doctor already assigned to this department' });
        }

        department.doctors.push(doctorId);
        await department.save();

        res.json({
            message: 'Doctor assigned successfully',
            department
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Assign staff to department
// @route   PUT /api/admin/departments/:id/assign-staff
// @access  Private/Admin
exports.assignStaffToDepartment = async (req, res) => {
    try {
        const { userId, role } = req.body;

        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Check if staff already assigned
        const alreadyAssigned = department.staff.some(s => s.userId.toString() === userId);
        if (alreadyAssigned) {
            return res.status(400).json({ message: 'Staff already assigned to this department' });
        }

        department.staff.push({ userId, role });
        await department.save();

        res.json({
            message: 'Staff assigned successfully',
            department
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get department performance
// @route   GET /api/admin/departments/:id/performance
// @access  Private/Admin
exports.getDepartmentPerformance = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id)
            .populate('doctors', 'fullName specialization')
            .populate('headOfDepartment', 'fullName');

        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        res.json({
            department: {
                name: department.name,
                code: department.code,
                headOfDepartment: department.headOfDepartment
            },
            performance: {
                totalDoctors: department.doctors.length,
                totalStaff: department.staff.length,
                totalPatients: department.totalPatients,
                totalAppointments: department.totalAppointments,
                totalRevenue: department.totalRevenue,
                averageRevenuePerAppointment: department.totalAppointments > 0
                    ? (department.totalRevenue / department.totalAppointments).toFixed(2)
                    : 0
            },
            doctors: department.doctors
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// All functions already exported via exports.functionName above

