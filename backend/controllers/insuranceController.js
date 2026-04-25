const InsuranceClaim = require('../models/InsuranceClaim');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Staff = require('../models/Staff');
const LabTest = require('../models/LabTest');
const geminiService = require('../services/geminiService');
const { generatePatientMedicalFilePDF, generateInsuranceClaimPDF } = require('../services/medicalFilePdfService');
const path = require('path');
const fs = require('fs');

// @desc    Generate ICD-10/CPT codes using AI
// @route   POST /api/insurance/generate-codes
// @access  Private/Doctor+Staff
exports.generateClaimCodes = async (req, res) => {
    try {
        const { patientId, memberId, appointmentId, prescriptionId, prescriptionIds, diagnosis, symptoms, reportText } = req.body;

        if (!patientId) return res.status(400).json({ message: 'Patient ID is required' });

        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        // Identify the beneficiary (patient or family member)
        let beneficiary = { age: patient.age, gender: patient.gender, name: patient.fullName };
        if (memberId && memberId !== 'null') {
            const member = patient.familyMembers.id(memberId);
            if (member) {
                beneficiary = { age: member.age, gender: member.gender, name: member.name };
            }
        }

        let medicinesList = '';
        let labTestsList = '';
        let finalDiagnosis = diagnosis || '';
        let finalSymptoms = symptoms || '';

        const ids = prescriptionIds || (prescriptionId ? [prescriptionId] : []);
        if (ids.length > 0) {
            const prescriptions = await Prescription.find({ _id: { $in: ids } });
            finalDiagnosis = prescriptions.map(p => p.diagnosis).filter(Boolean).join(', ') || finalDiagnosis;
            finalSymptoms = prescriptions.map(p => p.symptoms).filter(Boolean).join(', ') || finalSymptoms;
            medicinesList = prescriptions.flatMap(p => (p.medicines || []).map(m => m.medicineName || m.name)).join(', ');
        }

        if (appointmentId) {
            const labTests = await LabTest.find({ appointmentId });
            labTestsList = labTests.map(lt => `${lt.testName}: ${lt.result || 'pending'}`).join(', ');
        }

        const codes = await geminiService.generateMedicalCodes({
            diagnosis: finalDiagnosis,
            symptoms: finalSymptoms,
            medicines: medicinesList,
            labTestResults: labTestsList,
            patientAge: beneficiary.age,
            patientGender: beneficiary.gender
        });

        res.json({ codes, patient: { id: patient._id, name: beneficiary.name, age: beneficiary.age, gender: beneficiary.gender } });
    } catch (error) {
        console.error('generateClaimCodes error:', error);
        if (error.message.includes('No active Gemini API key') || error.message.includes('No active AI')) {
            return res.status(503).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error generating codes: ' + error.message });
    }
};

// @desc    Generate claim narrative using AI
// @route   POST /api/insurance/generate-narrative
// @access  Private/Doctor+Staff
exports.generateClaimNarrative = async (req, res) => {
    try {
        const { patientId, memberId, appointmentId, prescriptionId, prescriptionIds, icdCodes, cptCodes, visitDate, diagnosis, symptoms } = req.body;

        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        // Identify the beneficiary
        let beneficiary = { age: patient.age, gender: patient.gender, name: patient.fullName };
        if (memberId && memberId !== 'null') {
            const member = patient.familyMembers.id(memberId);
            if (member) {
                beneficiary = { age: member.age, gender: member.gender, name: member.name };
            }
        }

        let doctorName = '';
        let medicines = '';
        let labTests = '';
        let finalDiagnosis = diagnosis || '';
        let finalSymptoms = symptoms || '';

        if (appointmentId) {
            const appointment = await Appointment.findById(appointmentId).populate('doctorId');
            if (appointment?.doctorId) doctorName = appointment.doctorId.fullName;
        }

        const ids = prescriptionIds || (prescriptionId ? [prescriptionId] : []);
        if (ids.length > 0) {
            const prescriptions = await Prescription.find({ _id: { $in: ids } });
            finalDiagnosis = prescriptions.map(p => p.diagnosis).filter(Boolean).join(', ') || finalDiagnosis;
            finalSymptoms = prescriptions.map(p => p.symptoms).filter(Boolean).join(', ') || finalSymptoms;
            medicines = prescriptions.flatMap(p => (p.medicines || []).map(m => m.medicineName || m.name)).join(', ');
        }

        if (appointmentId) {
            const labTestDocs = await LabTest.find({ appointmentId });
            labTests = labTestDocs.map(lt => lt.testName).join(', ');
        }

        const narrative = await geminiService.generateClaimNarrative({
            patientName: beneficiary.name,
            patientAge: beneficiary.age,
            patientGender: beneficiary.gender,
            diagnosis: finalDiagnosis,
            symptoms: finalSymptoms,
            treatment: 'Medical consultation and treatment',
            medicines,
            labTests,
            icdCodes: icdCodes?.map(c => c.code).join(', '),
            cptCodes: cptCodes?.map(c => c.code).join(', '),
            visitDate,
            doctorName
        });

        res.json({ narrative });
    } catch (error) {
        console.error('generateClaimNarrative error:', error);
        if (error.message.includes('No active Gemini API key') || error.message.includes('No active AI')) {
            return res.status(503).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error generating narrative: ' + error.message });
    }
};

// @desc    Analyze a medical report text using AI
// @route   POST /api/insurance/analyze-report
// @access  Private/Doctor+Staff
exports.analyzeReport = async (req, res) => {
    try {
        const { reportText } = req.body;
        if (!reportText || reportText.trim().length < 20) {
            return res.status(400).json({ message: 'Report text is required (minimum 20 characters)' });
        }
        const result = await geminiService.analyzeMedicalReport(reportText);
        res.json(result);
    } catch (error) {
        console.error('analyzeReport error:', error);
        if (error.message.includes('No active Gemini API key') || error.message.includes('No active AI')) {
            return res.status(503).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error analyzing report: ' + error.message });
    }
};

// Helper to generate unique claim reference
const generateClaimRef = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CLM-${date}-${random}`;
};

// @desc    Publicly verify a claim by reference
// @route   GET /api/insurance/public/verify/:ref
// @access  Public
exports.verifyClaim = async (req, res) => {
    try {
        const { ref } = req.params;
        let claim = await InsuranceClaim.findOne({ claimReference: ref })
            .populate('patientId', 'fullName gender')
            .populate('doctorId', 'fullName specialization');

        if (!claim) {
            // Legacy/Fallback check: slice(-10) of ID
            const claims = await InsuranceClaim.find().populate('patientId', 'fullName gender').populate('doctorId', 'fullName specialization');
            claim = claims.find(c => c._id.toString().toUpperCase().endsWith(ref.toUpperCase()));
            
            if (!claim) return res.status(404).json({ message: 'Claim not found or invalid reference' });
        }

        res.json({
            success: true,
            claim: {
                reference: claim.claimReference || claim._id.toString().slice(-10).toUpperCase(),
                patientName: claim.patientId?.fullName,
                doctorName: claim.doctorId?.fullName,
                specialization: claim.doctorId?.specialization,
                visitDate: claim.appointmentId?.appointmentDate || claim.createdAt,
                status: claim.status,
                insuranceProvider: claim.insuranceProvider,
                claimType: claim.claimType,
                verifiedAt: new Date(),
                hospital: 'CareFusion Hospital'
            }
        });
    } catch (error) {
        console.error('verifyClaim error:', error);
        res.status(500).json({ message: 'Verification error' });
    }
};

// @desc    Save or update a claim draft
// @route   POST /api/insurance/claims
// @access  Private/Doctor+Staff
exports.saveClaim = async (req, res) => {
    try {
        const {
            claimId, patientId, memberId, appointmentId, prescriptionId, prescriptionIds,
            clinicalInfo, icdCodes, cptCodes, codingNotes, claimNarrative,
            status, claimAmount,
            claimType, insuranceProvider, policyNumber, membershipId, shareWithPatient
        } = req.body;

        let claim;
        if (claimId) {
            claim = await InsuranceClaim.findById(claimId);
            if (!claim) return res.status(404).json({ message: 'Claim not found' });
        } else {
            claim = new InsuranceClaim({ patientId, appointmentId, prescriptionId, prescriptionIds });
        }

        // Attach doctor or staff who is filing
        if (req.user.role === 'doctor') {
            const doctorProfile = await Doctor.findOne({ userId: req.user._id });
            if (doctorProfile) claim.doctorId = doctorProfile._id;
        }
        if (req.user.role === 'staff') {
            const staffProfile = await Staff.findOne({ userId: req.user._id });
            if (staffProfile) claim.staffId = staffProfile._id;
        }

        // Attach member info if applicable
        if (memberId && memberId !== 'null') {
            const patient = await Patient.findById(patientId);
            const member = patient?.familyMembers.id(memberId);
            if (member) {
                claim.bookedForMember = {
                    memberId: member._id.toString(),
                    memberName: member.name,
                    relation: member.relation
                };
            }
        } else {
            claim.bookedForMember = { memberId: null, memberName: null, relation: null };
        }

        if (prescriptionId) claim.prescriptionId = prescriptionId;
        if (prescriptionIds) claim.prescriptionIds = prescriptionIds;
        if (clinicalInfo) claim.clinicalInfo = clinicalInfo;
        if (icdCodes) claim.icdCodes = icdCodes;
        if (cptCodes) claim.cptCodes = cptCodes;
        if (codingNotes !== undefined) claim.codingNotes = codingNotes;
        if (claimNarrative !== undefined) claim.claimNarrative = claimNarrative;
        if (claimAmount !== undefined) claim.claimAmount = claimAmount;
        if (claimType) claim.claimType = claimType;
        if (insuranceProvider !== undefined) claim.insuranceProvider = insuranceProvider;
        if (policyNumber !== undefined) claim.policyNumber = policyNumber;
        if (membershipId !== undefined) claim.membershipId = membershipId;
        if (shareWithPatient !== undefined) claim.shareWithPatient = shareWithPatient;

        if (status) {
            claim.status = status;
            if (status === 'submitted') claim.submittedAt = new Date();
        }

        // Generate reference if not present
        if (!claim.claimReference) {
            claim.claimReference = generateClaimRef();
        }

        await claim.save();
        res.status(claimId ? 200 : 201).json({ message: claimId ? 'Claim updated' : 'Claim saved', claim });
    } catch (error) {
        console.error('saveClaim error:', error);
        res.status(500).json({ message: 'Error saving claim: ' + error.message });
    }
};

// @desc    Update claim status (staff/admin/doctor)
// @route   PUT /api/insurance/claims/:id/status
// @access  Private/Doctor+Staff+Admin
exports.updateClaimStatus = async (req, res) => {
    try {
        const { status, approvedAmount, rejectionReason } = req.body;
        const claim = await InsuranceClaim.findById(req.params.id);
        if (!claim) return res.status(404).json({ message: 'Claim not found' });

        const allowed = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid'];
        if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

        claim.status = status;
        if (approvedAmount !== undefined) claim.approvedAmount = approvedAmount;
        if (rejectionReason !== undefined) claim.rejectionReason = rejectionReason;
        claim.reviewedAt = new Date();
        claim.reviewedBy = req.user._id;

        await claim.save();
        res.json({ message: 'Claim status updated', claim });
    } catch (error) {
        console.error('updateClaimStatus error:', error);
        res.status(500).json({ message: 'Error updating claim status: ' + error.message });
    }
};

// @desc    Get all claims (staff/admin dashboard)
// @route   GET /api/insurance/admin/all
// @access  Private/Staff+Admin
exports.getAllClaims = async (req, res) => {
    try {
        const { status, patientId, startDate, endDate, claimType, page = 1, limit = 50 } = req.query;
        const query = {};
        if (status && status !== 'all') query.status = status;
        if (patientId) query.patientId = patientId;
        if (claimType && claimType !== 'all') query.claimType = claimType;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
        }

        const claims = await InsuranceClaim.find(query)
            .populate('patientId', 'fullName age gender contactNumber mobile')
            .populate('doctorId', 'fullName specialization')
            .populate('appointmentId', 'appointmentDate timeSlot')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await InsuranceClaim.countDocuments(query);
        res.json({ claims, total, page: Number(page) });
    } catch (error) {
        console.error('getAllClaims error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Generate a structured insurance claim file (JSON)
// @route   GET /api/insurance/claims/:id/file
// @access  Private/Doctor+Staff
exports.generateClaimFile = async (req, res) => {
    try {
        const claim = await InsuranceClaim.findById(req.params.id)
            .populate('patientId', 'fullName age gender contactNumber mobile email')
            .populate('doctorId', 'fullName specialization')
            .populate('appointmentId', 'appointmentDate slotStartTime slotEndTime')
            .populate('prescriptionId', 'diagnosis medicines labTestsRequested prescriptionId');

        if (!claim) return res.status(404).json({ message: 'Claim not found' });

        const patient = claim.patientId;
        const doctor = claim.doctorId;
        const appt = claim.appointmentId;

        const claimFile = {
            claimFileVersion: '1.0',
            generatedAt: new Date().toISOString(),
            hospitalInfo: {
                name: 'CareFusion Hospital',
                system: 'CareFusion HMS'
            },
            claimDetails: {
                claimId: claim._id.toString(),
                claimType: claim.claimType || 'cashless',
                status: claim.status,
                submittedAt: claim.submittedAt,
                claimAmount: claim.claimAmount,
                approvedAmount: claim.approvedAmount
            },
            insuranceInfo: {
                provider: claim.insuranceProvider || 'Not specified',
                policyNumber: claim.policyNumber || 'Not specified',
                membershipId: claim.membershipId || 'Not specified'
            },
            patientInfo: {
                name: claim.bookedForMember?.memberName || patient?.fullName,
                age: (claim.bookedForMember?.memberId) ? 
                    (patient?.familyMembers.id(claim.bookedForMember.memberId)?.age) : 
                    patient?.age,
                gender: (claim.bookedForMember?.memberId) ? 
                    (patient?.familyMembers.id(claim.bookedForMember.memberId)?.gender) : 
                    patient?.gender,
                mobile: patient?.mobile || patient?.contactNumber,
                email: patient?.email
            },
            doctorInfo: {
                name: doctor?.fullName ? `Dr. ${doctor.fullName}` : 'Not specified',
                specialization: doctor?.specialization
            },
            visitInfo: {
                visitDate: appt?.appointmentDate || claim.createdAt,
                timeSlot: appt?.slotStartTime ? `${appt.slotStartTime} - ${appt.slotEndTime}` : 'N/A'
            },
            clinicalInfo: {
                diagnosis: claim.clinicalInfo?.diagnosis,
                symptoms: claim.clinicalInfo?.symptoms,
                treatment: claim.clinicalInfo?.treatment,
                medicines: claim.clinicalInfo?.medicines,
                labTests: claim.clinicalInfo?.labTests
            },
            medicalCodes: {
                icdCodes: (claim.icdCodes || []).map(c => ({ code: c.code, description: c.description, confidence: c.confidence })),
                cptCodes: (claim.cptCodes || []).map(c => ({ code: c.code, description: c.description, confidence: c.confidence })),
                codingNotes: claim.codingNotes
            },
            claimNarrative: claim.claimNarrative
        };

        // Mark claim file as generated
        await InsuranceClaim.findByIdAndUpdate(claim._id, { claimFileGeneratedAt: new Date() });

        res.json(claimFile);
    } catch (error) {
        console.error('generateClaimFile error:', error);
        res.status(500).json({ message: 'Error generating claim file: ' + error.message });
    }
};

// @desc    Get all claims for a patient
// @route   GET /api/insurance/patient/:patientId
// @access  Private/Patient+Doctor+Staff
exports.getPatientClaims = async (req, res) => {
    try {
        const query = { patientId: req.params.patientId };
        
        // If the requester is the patient themselves, only show shared claims
        if (req.user.role === 'patient') {
            query.shareWithPatient = true;
        }

        const claims = await InsuranceClaim.find(query)
            .populate('appointmentId', 'appointmentDate timeSlot slotStartTime slotEndTime')
            .populate('doctorId', 'fullName specialization')
            .sort({ createdAt: -1 });
        res.json(claims);
    } catch (error) {
        console.error('getPatientClaims error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get prescriptions for a patient (for claim selection)
// @route   GET /api/insurance/patient/:patientId/prescriptions
// @access  Private/Doctor+Staff
exports.getPatientPrescriptions = async (req, res) => {
    try {
        const { memberId } = req.query;
        const query = { patientId: req.params.patientId };
        
        // If memberId is 'null' or not provided, filter for the main patient
        if (memberId && memberId !== 'null') {
            query['bookedForMember.memberId'] = memberId;
        } else {
            query['bookedForMember.memberId'] = null;
        }

        const prescriptions = await Prescription.find(query)
            .populate('appointmentId', 'appointmentDate slotStartTime')
            .populate('doctorId', 'fullName specialization')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(prescriptions);
    } catch (error) {
        console.error('getPatientPrescriptions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get claims for appointments of a specific doctor
// @route   GET /api/insurance/doctor/claims
// @access  Private/Doctor
exports.getDoctorClaims = async (req, res) => {
    try {
        const doctorProfile = await Doctor.findOne({ userId: req.user._id });
        if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });

        const claims = await InsuranceClaim.find({ doctorId: doctorProfile._id })
            .populate('patientId', 'fullName age gender')
            .populate('appointmentId', 'appointmentDate timeSlot slotStartTime slotEndTime')
            .sort({ createdAt: -1 });
        res.json(claims);
    } catch (error) {
        console.error('getDoctorClaims error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single claim details
// @route   GET /api/insurance/claims/:id
// @access  Private
exports.getClaimById = async (req, res) => {
    try {
        const claim = await InsuranceClaim.findById(req.params.id)
            .populate('patientId', 'fullName age gender contactNumber mobile')
            .populate('appointmentId', 'appointmentDate timeSlot slotStartTime slotEndTime')
            .populate('doctorId', 'fullName specialization');
        if (!claim) return res.status(404).json({ message: 'Claim not found' });
        res.json(claim);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Download Patient Medical File PDF
// @route   GET /api/insurance/prescription/:prescriptionId/medical-file-pdf
// @access  Private/Doctor+Staff+Patient
exports.downloadMedicalFilePDF = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.prescriptionId)
            .populate('patientId')
            .populate('doctorId')
            .populate('appointmentId');

        if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

        const patient = prescription.patientId;
        const doctor = prescription.doctorId;
        const appointment = prescription.appointmentId;

        // Fetch lab tests for this appointment
        const labTests = appointment
            ? await LabTest.find({ appointmentId: appointment._id })
            : [];

        const { filepath, filename } = await generatePatientMedicalFilePDF(
            prescription, doctor, patient, labTests, appointment
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        const stream = fs.createReadStream(filepath);
        stream.pipe(res);
        stream.on('error', () => res.status(500).json({ message: 'Error streaming PDF' }));
        stream.on('end', () => {
            // Clean up temp file after 60 seconds
            setTimeout(() => { try { fs.unlinkSync(filepath); } catch (_) {} }, 60000);
        });
    } catch (error) {
        console.error('downloadMedicalFilePDF error:', error);
        res.status(500).json({ message: 'Error generating medical file: ' + error.message });
    }
};

// @desc    Download Insurance Claim PDF
// @route   GET /api/insurance/claims/:id/pdf
// @access  Private/Doctor+Staff
exports.downloadInsuranceClaimPDF = async (req, res) => {
    try {
        const claim = await InsuranceClaim.findById(req.params.id)
            .populate('patientId')
            .populate('doctorId')
            .populate('appointmentId')
            .populate('prescriptionId');

        if (!claim) return res.status(404).json({ message: 'Claim not found' });

        // Security check for patients: only allow if shared
        if (req.user.role === 'patient' && !claim.shareWithPatient) {
            return res.status(403).json({ message: 'This claim has not been shared with you yet' });
        }

        const patient = claim.patientId;
        const doctor = claim.doctorId;

        // Fetch lab tests if appointment exists
        const labTests = claim.appointmentId
            ? await LabTest.find({ appointmentId: claim.appointmentId._id })
            : [];

        const { filepath, filename } = await generateInsuranceClaimPDF(
            claim, patient, doctor, labTests
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        const stream = fs.createReadStream(filepath);
        stream.pipe(res);
        stream.on('error', () => res.status(500).json({ message: 'Error streaming PDF' }));
        stream.on('end', () => {
            setTimeout(() => { try { fs.unlinkSync(filepath); } catch (_) {} }, 60000);
        });
    } catch (error) {
        console.error('downloadInsuranceClaimPDF error:', error);
        res.status(500).json({ message: 'Error generating insurance claim PDF: ' + error.message });
    }
};
