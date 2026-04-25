const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate QR code for prescription
 * @param {Object} prescription - Prescription object
 * @returns {Promise<string>} - Base64 encoded QR code image
 */
exports.generatePrescriptionQR = async (prescription) => {
    try {
        // Create QR code data with prescription details
        const qrData = {
            prescriptionId: prescription.prescriptionId,
            patientId: prescription.patientId.toString(),
            doctorId: prescription.doctorId.toString(),
            date: prescription.createdAt,
            verificationCode: crypto.randomBytes(16).toString('hex')
        };

        // Generate QR code as data URL (base64)
        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 1
        });

        return {
            qrCode: qrCodeDataURL,
            verificationCode: qrData.verificationCode
        };
    } catch (error) {
        console.error('QR Code generation error:', error);
        throw new Error('Failed to generate QR code');
    }
};

/**
 * Verify QR code and extract prescription data
 * @param {string} qrDataString - QR code data string
 * @returns {Object} - Parsed prescription data
 */
exports.verifyPrescriptionQR = (qrDataString) => {
    try {
        const qrData = JSON.parse(qrDataString);

        if (!qrData.prescriptionId || !qrData.verificationCode) {
            throw new Error('Invalid QR code data');
        }

        return qrData;
    } catch (error) {
        throw new Error('Invalid or corrupted QR code');
    }
};

/**
 * Generate shareable prescription link
 * @param {string} prescriptionId - Prescription ID
 * @param {string} verificationCode - Verification code
 * @returns {string} - Shareable URL
 */
exports.generateShareableLink = (prescriptionId, verificationCode) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${frontendUrl}/prescription/view/${prescriptionId}?code=${verificationCode}`;
};
