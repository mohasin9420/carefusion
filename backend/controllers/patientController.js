const path = require('path');
const fs = require('fs');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const LabTest = require('../models/LabTest');
const Patient = require('../models/Patient');

// @desc    Get patient appointments
// @route   GET /api/patient/appointments
// @access  Private/Patient
exports.getAppointments = async (req, res) => {
    try {
        // Find patient profile
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const appointments = await Appointment.find({ patientId: patient._id })
            .populate('doctorId', 'fullName specialization department')
            .sort({ appointmentDate: -1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Book appointment
// @route   POST /api/patient/appointments
// @access  Private/Patient
exports.bookAppointment = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const { doctorId, appointmentDate, timeSlot, notes } = req.body;

        const appointment = await Appointment.create({
            patientId: patient._id,
            doctorId,
            appointmentDate,
            timeSlot,
            notes,
            bookedBy: req.user._id
        });

        res.status(201).json(appointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get patient prescriptions
// @route   GET /api/patient/prescriptions
// @access  Private/Patient
exports.getPrescriptions = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const prescriptions = await Prescription.find({ patientId: patient._id })
            .populate('doctorId', 'fullName specialization')
            .sort({ createdAt: -1 });

        res.json(prescriptions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get patient lab reports
// @route   GET /api/patient/lab-reports
// @access  Private/Patient
exports.getLabReports = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const labTests = await LabTest.find({ patientId: patient._id })
            .populate('doctorId', 'fullName specialization')
            .sort({ requestedDate: -1 });

        res.json(labTests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get patient profile
// @route   GET /api/patient/profile
// @access  Private/Patient
exports.getProfile = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update patient profile
// @route   PUT /api/patient/profile
// @access  Private/Patient
exports.updateProfile = async (req, res) => {
    try {
        const patient = await Patient.findOneAndUpdate(
            { userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Download prescription PDF
// @route   GET /api/patient/prescriptions/:id/download
// @access  Private/Patient
exports.downloadPrescriptionPDF = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const prescription = await Prescription.findOne({
            _id: req.params.id,
            patientId: patient._id
        });

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found or access denied' });
        }

        if (!prescription.pdfPath) {
            return res.status(404).json({ message: 'PDF not yet generated for this prescription' });
        }

        const filepath = path.join(__dirname, '../uploads', prescription.pdfPath);
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ message: 'PDF file not found' });
        }

        const filename = `Prescription-${prescription.prescriptionId}.pdf`;
        res.download(filepath, filename, (err) => {
            if (err && !res.headersSent) {
                res.status(500).json({ message: 'Download failed' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────────────
// FAMILY MEMBER CRUD
// ─────────────────────────────────────────────────

// @desc    Get all family members
// @route   GET /api/patient/family
// @access  Private/Patient
exports.getFamilyMembers = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id }).select('familyMembers');
        if (!patient) return res.status(404).json({ message: 'Patient profile not found' });
        res.json(patient.familyMembers || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add a family member
// @route   POST /api/patient/family
// @access  Private/Patient
exports.addFamilyMember = async (req, res) => {
    try {
        const { name, relation, age, gender, bloodGroup } = req.body;
        if (!name || !relation) {
            return res.status(400).json({ message: 'Name and relation are required' });
        }

        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

        patient.familyMembers.push({ name, relation, age, gender, bloodGroup });
        await patient.save();

        res.status(201).json({
            message: 'Family member added successfully',
            familyMembers: patient.familyMembers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a family member
// @route   PUT /api/patient/family/:memberId
// @access  Private/Patient
exports.updateFamilyMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { name, relation, age, gender, bloodGroup } = req.body;

        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

        const member = patient.familyMembers.id(memberId);
        if (!member) return res.status(404).json({ message: 'Family member not found' });

        if (name !== undefined) member.name = name;
        if (relation !== undefined) member.relation = relation;
        if (age !== undefined) member.age = age;
        if (gender !== undefined) member.gender = gender;
        if (bloodGroup !== undefined) member.bloodGroup = bloodGroup;

        await patient.save();

        res.json({
            message: 'Family member updated successfully',
            familyMembers: patient.familyMembers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a family member
// @route   DELETE /api/patient/family/:memberId
// @access  Private/Patient
exports.deleteFamilyMember = async (req, res) => {
    try {
        const { memberId } = req.params;

        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

        const member = patient.familyMembers.id(memberId);
        if (!member) return res.status(404).json({ message: 'Family member not found' });

        member.deleteOne();
        await patient.save();

        res.json({
            message: 'Family member removed successfully',
            familyMembers: patient.familyMembers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// @desc    Raise a dispute on a lab report
// @route   POST /api/patient/lab-reports/:id/dispute
// @access  Private/Patient
exports.raiseLabDispute = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim().length < 5) {
            return res.status(400).json({ message: 'Please provide a detailed issue description (min 5 characters)' });
        }

        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        const labTest = await LabTest.findOne({ _id: req.params.id, patientId: patient._id });
        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found or access denied' });
        }

        if (labTest.reportDispute && labTest.reportDispute.status === 'open') {
            return res.status(400).json({ message: 'A dispute is already open for this test' });
        }

        labTest.reportDispute = {
            message: message.trim(),
            raisedAt: new Date(),
            status: 'open',
            resolvedAt: null,
            resolutionNote: null
        };

        await labTest.save();

        res.json({ message: 'Issue raised successfully. The laboratory has been notified.', labTest });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
