const LabTest = require('../models/LabTest');
const { createLabReportNotification } = require('./notificationController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/lab-reports');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, JPG, and PNG files are allowed'));
        }
    }
});

// Helper: delete file from disk safely
const deleteFileFromDisk = (filePath) => {
    if (!filePath) return;
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    }
};

// @desc    Get lab test requests
// @route   GET /api/laboratory/tests
// @access  Private/Laboratory
exports.getLabTests = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};

        const labTests = await LabTest.find(query)
            .populate('patientId', 'fullName age gender mobile userId')
            .populate('doctorId', 'fullName specialization userId')
            .sort({ requestedDate: -1 });

        res.json(labTests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update lab test status
// @route   PUT /api/laboratory/test/:id
// @access  Private/Laboratory
exports.updateLabTestStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;

        const labTest = await LabTest.findByIdAndUpdate(
            req.params.id,
            {
                status,
                notes,
                processedBy: req.user._id,
                ...(status === 'completed' && { testingCompletedAt: new Date() })
            },
            { new: true }
        )
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization');

        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        res.json(labTest);
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Upload / Replace lab report (with payment amount)
// @route   POST /api/laboratory/upload-report/:id
// @access  Private/Laboratory
exports.uploadReport = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file (PDF, DOC, DOCX, JPG, or PNG)' });
        }

        const labTest = await LabTest.findById(req.params.id)
            .populate('patientId', 'fullName age gender mobile userId')
            .populate('doctorId', 'fullName specialization userId');

        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        // If replacing, log old report in history and remove from disk
        if (labTest.reportPDF) {
            labTest.reportHistory.push({
                filePath: labTest.reportPDF,
                action: 'replaced',
                actionAt: new Date()
            });
            deleteFileFromDisk(labTest.reportPDF);
        } else {
            // First upload — log it
            labTest.reportHistory.push({
                filePath: req.file.path,
                action: 'uploaded',
                actionAt: new Date()
            });
        }

        labTest.reportPDF = req.file.path;
        labTest.status = 'completed';
        labTest.testingCompletedAt = new Date();
        labTest.processedBy = req.user._id;

        // Save payment amount if provided
        const paymentAmount = parseFloat(req.body.paymentAmount);
        if (!isNaN(paymentAmount) && paymentAmount >= 0) {
            labTest.paymentAmount = paymentAmount;
        }

        // When lab replaces/uploads a new report, auto-resolve any open dispute
        if (labTest.reportDispute && labTest.reportDispute.status === 'open') {
            labTest.reportDispute.status = 'resolved';
            labTest.reportDispute.resolvedAt = new Date();
            labTest.reportDispute.resolutionNote = 'Report was replaced by the laboratory.';
        }

        await labTest.save();
        
        try {
            await createLabReportNotification(labTest);
        } catch (notifErr) {
            console.error('Notification delivery failed (ignoring for response):', notifErr);
        }

        res.json(labTest);
    } catch (error) {
        console.error('CRITICAL: Lab Report Upload Failure');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Stack Trace:', error.stack);
        
        if (error.errors) console.error('Validation Errors:', JSON.stringify(error.errors, null, 2));
        
        res.status(500).json({ 
            message: 'Server error: ' + (error.message || 'Unknown error'),
            details: error.errors ? Object.keys(error.errors) : undefined,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @desc    Delete lab report (lab resets it to in-progress)
// @route   DELETE /api/laboratory/report/:id
// @access  Private/Laboratory
exports.deleteReport = async (req, res) => {
    try {
        const labTest = await LabTest.findById(req.params.id);

        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        if (!labTest.reportPDF) {
            return res.status(400).json({ message: 'No report to delete' });
        }

        // Log deletion in history and remove from disk
        labTest.reportHistory.push({
            filePath: labTest.reportPDF,
            action: 'deleted',
            actionAt: new Date()
        });
        deleteFileFromDisk(labTest.reportPDF);

        // Clear report and revert status
        labTest.reportPDF = undefined;
        labTest.status = 'in-progress';
        labTest.testingCompletedAt = undefined;

        await labTest.save();

        const updated = await LabTest.findById(req.params.id)
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization');

        res.json({ message: 'Report deleted successfully', labTest: updated });
    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Resolve a patient dispute on a lab test
// @route   PUT /api/laboratory/dispute/:id/resolve
// @access  Private/Laboratory
exports.resolveDispute = async (req, res) => {
    try {
        const { resolutionNote } = req.body;

        const labTest = await LabTest.findById(req.params.id)
            .populate('patientId', 'fullName age gender mobile')
            .populate('doctorId', 'fullName specialization');

        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        if (!labTest.reportDispute || labTest.reportDispute.status !== 'open') {
            return res.status(400).json({ message: 'No open dispute to resolve' });
        }

        labTest.reportDispute.status = 'resolved';
        labTest.reportDispute.resolvedAt = new Date();
        labTest.reportDispute.resolutionNote = resolutionNote || 'Resolved by laboratory staff.';

        await labTest.save();

        res.json({ message: 'Dispute resolved successfully', labTest });
    } catch (error) {
        console.error('Resolve dispute error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Export multer middleware for use in routes
exports.uploadMiddleware = upload.single('report');