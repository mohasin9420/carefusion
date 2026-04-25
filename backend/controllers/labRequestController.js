const LabTest = require('../models/LabTest');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');

// @desc    Create lab test request
// @route   POST /api/laboratory/requests
// @access  Private/Doctor
exports.createLabRequest = async (req, res) => {
    try {
        const {
            patientId,
            testName,
            testCategory,
            priority,
            clinicalNotes,
            expectedTAT,
            sampleType
        } = req.body;

        const doctor = await Doctor.findOne({ userId: req.user._id });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const labTest = await LabTest.create({
            patientId,
            doctorId: doctor._id,
            testName,
            testCategory,
            priority: priority || 'routine',
            clinicalNotes,
            expectedTAT: expectedTAT || 24, // Default 24 hours
            sampleType,
            status: 'requested'
        });

        await labTest.populate([
            { path: 'patientId', select: 'fullName age gender mobile' },
            { path: 'doctorId', select: 'fullName specialization' }
        ]);

        res.status(201).json({
            message: 'Lab test requested successfully',
            labTest
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get lab requests (for lab technicians)
// @route   GET /api/laboratory/requests
// @access  Private/Lab
exports.getLabRequests = async (req, res) => {
    try {
        const { status, priority, assignedTo } = req.query;

        const query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (assignedTo) query.assignedTo = assignedTo;

        const labTests = await LabTest.find(query)
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization')
            .populate('assignedTo', 'name email')
            .sort({ priority: -1, createdAt: 1 }); // STAT first, then oldest first

        res.json(labTests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Assign technician to lab test
// @route   PUT /api/laboratory/requests/:id/assign
// @access  Private/Lab
exports.assignTechnician = async (req, res) => {
    try {
        const { technicianId } = req.body;

        const labTest = await LabTest.findById(req.params.id);

        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        labTest.assignedTo = technicianId;
        labTest.assignedAt = new Date();
        await labTest.save();

        res.json({
            message: 'Technician assigned successfully',
            labTest
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update lab test status
// @route   PUT /api/laboratory/requests/:id/status
// @access  Private/Lab
exports.updateLabStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;

        const validStatuses = ['requested', 'sample-collected', 'in-progress', 'completed', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const labTest = await LabTest.findById(req.params.id);

        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        labTest.status = status;

        // Update timestamps based on status
        if (status === 'sample-collected') {
            labTest.sampleCollectedAt = new Date();
            labTest.sampleCollectedBy = req.user._id;
        } else if (status === 'in-progress') {
            labTest.testingStartedAt = new Date();
        } else if (status === 'completed') {
            labTest.testingCompletedAt = new Date();
        } else if (status === 'delivered') {
            labTest.deliveredAt = new Date();
        }

        if (notes) {
            labTest.technicianNotes = notes;
        }

        await labTest.save();

        res.json({
            message: `Status updated to ${status}`,
            labTest
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Upload lab report with results
// @route   POST /api/laboratory/requests/:id/report
// @access  Private/Lab
exports.uploadLabReport = async (req, res) => {
    try {
        const { results, reportPDF, images, finalRemarks } = req.body;

        const labTest = await LabTest.findById(req.params.id);

        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        if (results) labTest.results = results;
        if (reportPDF) labTest.reportPDF = reportPDF;
        if (images) labTest.images = images;
        if (finalRemarks) labTest.finalRemarks = finalRemarks;

        labTest.status = 'completed';
        labTest.testingCompletedAt = new Date();
        labTest.verifiedBy = req.user._id;
        labTest.verifiedAt = new Date();

        await labTest.save();

        // Send notifications
        await sendLabResultNotifications(labTest);

        res.json({
            message: 'Report uploaded successfully',
            labTest
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get patient's lab history with comparison
// @route   GET /api/laboratory/patient/:patientId/history
// @access  Private
exports.getPatientLabHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { testName } = req.query;

        const query = {
            patientId,
            status: 'completed'
        };

        if (testName) {
            query.testName = { $regex: testName, $options: 'i' };
        }

        const labTests = await LabTest.find(query)
            .populate('doctorId', 'fullName specialization')
            .sort({ createdAt: -1 });

        // Create comparison data for same test types
        const comparisonData = {};
        labTests.forEach(test => {
            if (!comparisonData[test.testName]) {
                comparisonData[test.testName] = [];
            }
            comparisonData[test.testName].push({
                date: test.createdAt,
                testId: test._id,
                results: test.results
            });
        });

        res.json({
            labTests,
            comparisonData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to send notifications
async function sendLabResultNotifications(labTest) {
    try {
        await labTest.populate([
            { path: 'patientId', select: 'fullName userId' },
            { path: 'doctorId', select: 'fullName userId' }
        ]);

        // Notify Doctor
        if (labTest.doctorId && labTest.doctorId.userId) {
            await Notification.create({
                userId: labTest.doctorId.userId,
                type: 'lab-result',
                title: 'Lab Test Completed',
                message: `Lab test results for ${labTest.patientId.fullName} (${labTest.testName}) are now available.`,
                data: { labTestId: labTest._id }
            });

            labTest.notificationsSent.doctor = {
                sent: true,
                sentAt: new Date()
            };
        }

        // Notify Patient
        if (labTest.patientId && labTest.patientId.userId) {
            await Notification.create({
                userId: labTest.patientId.userId,
                type: 'lab-result',
                title: 'Lab Results Ready',
                message: `Your lab test results for ${labTest.testName} are now available.`,
                data: { labTestId: labTest._id }
            });

            labTest.notificationsSent.patient = {
                sent: true,
                sentAt: new Date()
            };
        }

        await labTest.save();
    } catch (error) {
        console.error('Notification error:', error);
    }
}

// All functions already exported via exports.functionName above