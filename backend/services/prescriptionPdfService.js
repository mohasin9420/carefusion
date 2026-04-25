const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const UPLOADS_DIR = path.join(__dirname, '../uploads/prescriptions');

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Generate professional prescription PDF matching template design
 * Features: Color header, organized layout, medication table, physician info
 */
async function generatePrescriptionPDF(prescription, doctor, patient, hospitalName = 'CareFusion Hospital') {
    const filename = `prescription-${prescription.prescriptionId.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
    const filepath = path.join(UPLOADS_DIR, filename);

    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const writeStream = fs.createWriteStream(filepath);
            doc.pipe(writeStream);

            const pageWidth = doc.page.width;
            const leftMargin = 40;
            const rightMargin = pageWidth - 40;
            let yPosition = 40;

            // Color gradient header bar
            doc.rect(0, 0, pageWidth, 3)
                .fill('#8B0000'); // Maroon

            doc.rect(0, 3, pageWidth, 3)
                .fill('#FF7F50'); // Orange

            yPosition = 20;

            // PRESCRIPTION TEMPLATE Title
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .fillColor('#8B0000')
                .text('PRESCRIPTION TEMPLATE', leftMargin, yPosition, { align: 'center', width: pageWidth - 80 });

            yPosition += 35;

            // Orange divider line
            doc.rect(leftMargin, yPosition, pageWidth - 80, 2)
                .fillAndStroke('#FF7F50');

            yPosition += 15;

            // Prescription No and Date (two columns)
            const col1X = leftMargin;
            const col2X = pageWidth / 2 + 20;

            doc.fontSize(10)
                .fillColor('#000000')
                .font('Helvetica-Bold')
                .text('Prescription No.', col1X, yPosition);

            doc.font('Helvetica')
                .text(prescription.prescriptionId, col1X, yPosition + 12);

            doc.font('Helvetica-Bold')
                .text('Prescription Date', col2X, yPosition);

            doc.font('Helvetica')
                .text(new Date(prescription.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), col2X, yPosition + 12);

            yPosition += 40;

            // Patient Information Section Header
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#8B0000')
                .text('Patient Information', leftMargin, yPosition);

            yPosition += 18;

            // Patient details in two columns
            const detailsStartY = yPosition;

            // Left column - Name, Phone, Email, Address
            doc.fontSize(9)
                .fillColor('#666666')
                .font('Helvetica-Bold')
                .text('Name', col1X, yPosition);

            doc.fillColor('#000000')
                .font('Helvetica')
                .text(patient.fullName || 'N/A', col1X, yPosition + 12);

            yPosition += 30;

            doc.fillColor('#666666')
                .font('Helvetica-Bold')
                .text('Phone Number', col1X, yPosition);

            doc.fillColor('#000000')
                .font('Helvetica')
                .text(patient.mobile || 'N/A', col1X, yPosition + 12);

            yPosition += 30;

            doc.fillColor('#666666')
                .font('Helvetica-Bold')
                .text('Email', col1X, yPosition);

            doc.fillColor('#000000')
                .font('Helvetica')
                .text(patient.userId?.email || 'N/A', col1X, yPosition + 12);

            yPosition += 30;

            doc.fillColor('#666666')
                .font('Helvetica-Bold')
                .text('Address', col1X, yPosition);

            doc.fillColor('#000000')
                .font('Helvetica')
                .text(patient.address || 'N/A', col1X, yPosition + 12, { width: 200 });

            // Right column - Age, DOB, Gender
            yPosition = detailsStartY;

            doc.fillColor('#666666')
                .font('Helvetica-Bold')
                .text('Age', col2X, yPosition);

            doc.fillColor('#000000')
                .font('Helvetica')
                .text(patient.age?.toString() || 'N/A', col2X, yPosition + 12);

            yPosition += 30;

            doc.fillColor('#666666')
                .font('Helvetica-Bold')
                .text('Date of Birth', col2X, yPosition);

            const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
            doc.fillColor('#000000')
                .font('Helvetica')
                .text(dob, col2X, yPosition + 12, { width: 200 });

            yPosition += 30;

            doc.fillColor('#666666')
                .font('Helvetica-Bold')
                .text('Gender', col2X, yPosition);

            doc.fillColor('#000000')
                .font('Helvetica')
                .text(patient.gender || 'N/A', col2X, yPosition + 12);

            yPosition += 50;

            // Allergies and Notable Health Condition in two columns
            doc.fillColor('#666666')
                .font('Helvetica-Bold')
                .text('Allergies', col1X, yPosition);

            doc.fillColor('#000000')
                .font('Helvetica')
                .text(patient.allergies || 'None', col1X, yPosition + 12, { width: 200 });

            doc.fillColor('#666666')
                .font('Helvetica-Bold')
                .text('Notable Health Condition', col2X, yPosition);

            doc.fillColor('#000000')
                .font('Helvetica')
                .text(prescription.diagnosis || 'None', col2X, yPosition + 12, { width: 200 });

            yPosition += 45;

            // Orange section header bar
            doc.rect(leftMargin, yPosition, pageWidth - 80, 15)
                .fill('#FF7F50');

            doc.fontSize(11)
                .fillColor('#FFFFFF')
                .font('Helvetica-Bold')
                .text('List of Prescribed Medications', leftMargin + 5, yPosition + 3);

            yPosition += 25;

            // Medication Table Headers
            const tableTop = yPosition;
            const medicationCol = leftMargin;
            const purposeCol = leftMargin + 120;
            const dosageCol = leftMargin + 220;
            const routeCol = leftMargin + 300;
            const frequencyCol = leftMargin + 370;

            doc.fontSize(9)
                .fillColor('#000000')
                .font('Helvetica-Bold');

            doc.text('Medication Name', medicationCol, tableTop);
            doc.text('Purpose', purposeCol, tableTop);
            doc.text('Dosage', dosageCol, tableTop);
            doc.text('Timing', routeCol, tableTop);
            doc.text('Frequency', frequencyCol, tableTop);

            yPosition = tableTop + 15;

            // Thin line under headers
            doc.moveTo(leftMargin, yPosition)
                .lineTo(rightMargin, yPosition)
                .strokeColor('#CCCCCC')
                .lineWidth(0.5)
                .stroke();

            yPosition += 10;

            // Medication rows
            doc.font('Helvetica')
                .fontSize(9)
                .fillColor('#000000');

            prescription.medicines.forEach((med, index) => {
                // Check for page break
                if (yPosition > doc.page.height - 150) {
                    doc.addPage();
                    yPosition = 50;
                }

                doc.text(med.name || 'N/A', medicationCol, yPosition, { width: 110 });
                doc.text(med.instructions || 'As prescribed', purposeCol, yPosition, { width: 90 });
                doc.text(med.dosage || 'N/A', dosageCol, yPosition, { width: 70 });
                doc.text(med.timing || 'After Meal', routeCol, yPosition, { width: 60 });
                doc.text(med.frequency || 'N/A', frequencyCol, yPosition, { width: 150 });

                yPosition += 25;
            });

            yPosition += 20;

            // Physician Information Section
            const physicianY = yPosition;

            doc.fontSize(9)
                .fillColor('#666666')
                .font('Helvetica-Bold')
                .text('Physician Name', col1X, physicianY);

            doc.fillColor('#8B0000')
                .fontSize(10)
                .font('Helvetica-Bold')
                .text(`Dr. ${doctor.fullName}`, col1X, physicianY + 12);

            doc.fillColor('#666666')
                .fontSize(9)
                .font('Helvetica-Bold')
                .text('Physician Phone Number', col2X, physicianY);

            doc.fillColor('#000000')
                .font('Helvetica')
                .text(doctor.mobile || doctor.phone || 'N/A', col2X, physicianY + 12);

            yPosition = physicianY + 35;

            doc.fillColor('#666666')
                .font('Helvetica-Bold')
                .text('Physician Signature', col1X, yPosition);

            // Signature line
            doc.moveTo(col1X, yPosition + 30)
                .lineTo(col1X + 150, yPosition + 30)
                .strokeColor('#000000')
                .lineWidth(0.5)
                .stroke();

            doc.fillColor('#666666')
                .font('Helvetica-Bold')
                .text('Physician Email', col2X, yPosition);

            doc.fillColor('#000000')
                .font('Helvetica')
                .text(doctor.userId?.email || 'N/A', col2X, yPosition + 12);

            yPosition += 50;

            doc.fillColor('#666666')
                .fontSize(8)
                .font('Helvetica')
                .text(new Date(prescription.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), col1X, yPosition);

            // Footer
            const footerY = doc.page.height - 60;
            doc.fontSize(8)
                .fillColor('#999999')
                .font('Helvetica')
                .text(`${hospitalName} - Digitally Generated Prescription`, leftMargin, footerY, {
                    align: 'center',
                    width: pageWidth - 80
                });

            doc.fontSize(7)
                .text('This prescription is valid for dispensing at authorized pharmacies only.', leftMargin, footerY + 12, {
                    align: 'center',
                    width: pageWidth - 80
                });

            doc.end();

            writeStream.on('finish', () => {
                resolve({ filepath, filename, relativePath: `prescriptions/${filename}` });
            });
            writeStream.on('error', reject);
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generatePrescriptionPDF, UPLOADS_DIR };
