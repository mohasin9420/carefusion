const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const qrCodeService = require('../services/qrCodeService');

// @desc    Generate QR code for existing prescription
// @route   POST /api/patient/prescriptions/:id/generate-qr
// @access  Private/Patient
exports.generatePrescriptionQR = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        const prescription = await Prescription.findOne({
            _id: req.params.id,
            patientId: patient._id
        });

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Generate QR code
        const { qrCode, verificationCode } = await qrCodeService.generatePrescriptionQR(prescription);

        // Update prescription
        prescription.qrCode = qrCode;
        prescription.verificationCode = verificationCode;
        await prescription.save();

        res.json({
            message: 'QR code generated successfully',
            qrCode,
            shareableLink: qrCodeService.generateShareableLink(prescription.prescriptionId, verificationCode)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Share prescription via email
// @route   POST /api/patient/prescriptions/:id/share
// @access  Private/Patient
exports.sharePrescription = async (req, res) => {
    // Email sharing has been disabled in this system.
    return res.status(410).json({
        message: 'Prescription sharing via email has been disabled. Please download the PDF and share it manually.'
    });
};

// @desc    Get patient's medical history (EMR Dashboard)
// @route   GET /api/patient/emr/history
// @access  Private/Patient
exports.getMedicalHistory = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        // Get all prescriptions
        const prescriptions = await Prescription.find({ patientId: patient._id })
            .populate('doctorId', 'fullName specialization')
            .sort({ createdAt: -1 })
            .limit(20);

        // Get all lab tests
        const LabTest = require('../models/LabTest');
        const labTests = await LabTest.find({ patientId: patient._id })
            .populate('doctorId', 'fullName')
            .sort({ createdAt: -1 })
            .limit(20);

        // Get all appointments
        const Appointment = require('../models/Appointment');
        const appointments = await Appointment.find({ patientId: patient._id })
            .populate('doctorId', 'fullName specialization')
            .sort({ appointmentDate: -1 })
            .limit(20);

        res.json({
            patient: {
                name: patient.fullName,
                age: patient.age,
                gender: patient.gender,
                bloodGroup: patient.bloodGroup,
                allergies: patient.allergies || [],
                chronicDiseases: patient.chronicDiseases || []
            },
            prescriptions,
            labTests,
            appointments,
            totalRecords: {
                prescriptions: prescriptions.length,
                labTests: labTests.length,
                appointments: appointments.length
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get health summary dashboard
// @route   GET /api/patient/emr/health-summary
// @access  Private/Patient
exports.getHealthSummary = async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        // Calculate health metrics
        const summary = {
            personalInfo: {
                name: patient.fullName,
                age: patient.age,
                gender: patient.gender,
                bloodGroup: patient.bloodGroup
            },
            allergies: patient.allergies || [],
            chronicDiseases: patient.chronicDiseases || [],
            vaccinations: patient.vaccinations || [],
            insurance: patient.insuranceDetails || null,
            emergencyContacts: patient.emergencyContacts || [],
            familyMembers: patient.familyMembers?.length || 0,
            riskFactors: []
        };

        // Calculate risk factors
        if (patient.chronicDiseases?.length > 0) {
            const severeConditions = patient.chronicDiseases.filter(d => d.severity === 'severe');
            if (severeConditions.length > 0) {
                summary.riskFactors.push({
                    type: 'chronic_disease',
                    level: 'high',
                    message: `${severeConditions.length} severe chronic condition(s)`
                });
            }
        }

        if (patient.allergies?.length > 0) {
            const severeAllergies = patient.allergies.filter(a => a.severity === 'severe');
            if (severeAllergies.length > 0) {
                summary.riskFactors.push({
                    type: 'allergy',
                    level: 'high',
                    message: `${severeAllergies.length} severe allergy(ies)`
                });
            }
        }

        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// All functions already exported via exports.functionName above