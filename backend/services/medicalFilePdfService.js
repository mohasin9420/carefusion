const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ─── Directory Setup ──────────────────────────────────────────────────────────
const MEDICAL_FILES_DIR = path.join(__dirname, '../uploads/medical-files');
const INSURANCE_FILES_DIR = path.join(__dirname, '../uploads/insurance-claims');

[MEDICAL_FILES_DIR, INSURANCE_FILES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
    primary: '#1a4fa3',     // deep blue
    primaryLight: '#2563eb',
    accent: '#059669',      // green
    accentRed: '#dc2626',
    headerBg: '#1e3a6e',
    sectionBg: '#f0f4ff',
    tableBg: '#f8fafc',
    tableHeader: '#1a4fa3',
    border: '#c7d2e8',
    text: '#1e293b',
    textLight: '#475569',
    textMuted: '#94a3b8',
    white: '#FFFFFF',
    warning: '#f59e0b',
    warningBg: '#fffbeb',
};

// ─── Helper Functions ─────────────────────────────────────────────────────────
function drawHorizLine(doc, x, y, width, color = C.border, lineWidth = 0.5) {
    doc.moveTo(x, y).lineTo(x + width, y)
        .strokeColor(color).lineWidth(lineWidth).stroke();
}

function drawWatermark(doc, text) {
    const pw = doc.page.width;
    const ph = doc.page.height;
    doc.save();
    doc.fillColor('#cbd5e1').opacity(0.15).fontSize(45).font('Helvetica-Bold');
    doc.translate(pw / 2, ph / 2).rotate(-35);
    doc.text(text, -250, -20, { width: 500, align: 'center' });
    doc.restore();
}

function sectionHeader(doc, label, x, y, width, color = C.primary) {
    doc.rect(x, y, width, 18).fill(color);
    doc.fontSize(9.5).fillColor(C.white).font('Helvetica-Bold')
        .text(label, x + 8, y + 4, { width: width - 16 });
    return y + 22;
}

function infoRow(doc, label, value, x, y, labelWidth = 110) {
    doc.fontSize(8.5).fillColor(C.textMuted).font('Helvetica-Bold')
        .text(label, x, y, { width: labelWidth });
    doc.fontSize(8.5).fillColor(C.text).font('Helvetica')
        .text(value || '—', x + labelWidth, y, { width: 200 });
    return y + 14;
}

function twoColInfoBlock(doc, leftPairs, rightPairs, x, y, pageWidth) {
    const col2x = x + (pageWidth - x * 2) / 2 + 10;
    let leftY = y;
    let rightY = y;
    leftPairs.forEach(([label, val]) => {
        leftY = infoRow(doc, label, val, x, leftY, 80);
        leftY += 2;
    });
    rightPairs.forEach(([label, val]) => {
        rightY = infoRow(doc, label, val, col2x, rightY, 80);
        rightY += 2;
    });
    return Math.max(leftY, rightY) + 6;
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function pageHeader(doc, title, subtitle = '') {
    const pw = doc.page.width;
    const lm = 40;
    // Top bar
    doc.rect(0, 0, pw, 48).fill(C.headerBg);
    doc.rect(0, 48, pw, 4).fill(C.primaryLight);

    doc.fontSize(13).fillColor(C.white).font('Helvetica-Bold')
        .text('CareFusion Hospital', lm, 10);
    doc.fontSize(7.5).fillColor('#93c5fd').font('Helvetica')
        .text('Comprehensive Healthcare Management System', lm, 26);

    // Title on right
    doc.fontSize(11).fillColor(C.white).font('Helvetica-Bold')
        .text(title, lm, 10, { align: 'right', width: pw - lm * 2 });
    if (subtitle) {
        doc.fontSize(7.5).fillColor('#bfdbfe').font('Helvetica')
            .text(subtitle, lm, 26, { align: 'right', width: pw - lm * 2 });
    }
    return 60;
}

function pageFooter(doc, label, pageNum = '') {
    const pw = doc.page.width;
    const lm = 40;
    const fy = doc.page.height - 32;
    doc.rect(0, fy - 6, pw, 38).fill('#f1f5f9');
    drawHorizLine(doc, lm, fy - 6, pw - lm * 2, C.border, 1);
    doc.fontSize(7).fillColor(C.textMuted).font('Helvetica')
        .text(label, lm, fy + 2, { align: 'center', width: pw - lm * 2 });
    if (pageNum) {
        doc.text(pageNum, pw - 80, fy + 2, { align: 'right', width: 40 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. PATIENT MEDICAL FILE PDF
// ─────────────────────────────────────────────────────────────────────────────
async function generatePatientMedicalFilePDF(prescription, doctor, patient, labTests = [], appointment = null) {
    const safeId = (prescription.prescriptionId || prescription._id.toString()).replace(/[/\\?%*:|"<>]/g, '-');
    const filename = `medical-file-${safeId}.pdf`;
    const filepath = path.join(MEDICAL_FILES_DIR, filename);

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
            const ws = fs.createWriteStream(filepath);
            doc.pipe(ws);

            const pw = doc.page.width;
            const lm = 40;
            const contentW = pw - lm * 2;

            let y = pageHeader(doc, 'PATIENT MEDICAL FILE', `Generated: ${formatDate(new Date())}`);

            doc.rect(lm, y, contentW, 20).fill(C.sectionBg);
            doc.fontSize(8).fillColor(C.primary).font('Helvetica-Bold')
                .text(`File Ref: ${prescription.prescriptionId || '—'}`, lm + 6, y + 5);
            doc.fillColor(C.textLight).font('Helvetica')
                .text(`Visit Date: ${formatDate(appointment?.appointmentDate || prescription.createdAt)}`, lm + 200, y + 5);
            doc.text(`Status: OFFICIAL MEDICAL RECORD`, lm, y + 5, { align: 'right', width: contentW - 6 });
            y += 28;

            y = sectionHeader(doc, '  PATIENT INFORMATION', lm, y, contentW);
            y = twoColInfoBlock(doc,
                [
                    ['Full Name', patient.fullName],
                    ['Age', patient.age ? `${patient.age} years` : null],
                    ['Gender', patient.gender],
                    ['Blood Group', patient.bloodGroup],
                ],
                [
                    ['Mobile', patient.mobile || patient.contactNumber],
                    ['Email', patient.email],
                    ['Date of Birth', formatDate(patient.dateOfBirth)],
                    ['Address', patient.address],
                ],
                lm + 6, y + 4, pw
            );
            if (patient.allergies) {
                doc.rect(lm, y, contentW, 16).fill('#fef2f2');
                doc.fontSize(8.5).fillColor(C.accentRed).font('Helvetica-Bold')
                    .text(`Known Allergies: ${patient.allergies}`, lm + 6, y + 4, { width: contentW - 12 });
                y += 20;
            }
            y += 6;

            y = sectionHeader(doc, '  ATTENDING PHYSICIAN & CONSULTATION DETAILS', lm, y, contentW);
            y = twoColInfoBlock(doc,
                [
                    ['Physician Name', `Dr. ${doctor.fullName}`],
                    ['Specialization', doctor.specialization],
                    ['Dept / Unit', doctor.department],
                ],
                [
                    ['Consultation Date', formatDate(appointment?.appointmentDate || prescription.createdAt)],
                    ['Time Slot', appointment?.slotStartTime ? `${appointment.slotStartTime} - ${appointment.slotEndTime}` : null],
                    ['Visit Type', appointment?.visitType || 'OPD'],
                    ['Consult Charge', appointment?.consultationCharge ? `Rs. ${appointment.consultationCharge}` : null],
                ],
                lm + 6, y + 4, pw
            );
            y += 6;

            y = sectionHeader(doc, '  DIAGNOSIS & CLINICAL FINDINGS', lm, y, contentW, C.accent);
            doc.rect(lm, y, contentW, 34).fill('#f0fdf4');
            doc.rect(lm, y, 4, 34).fill(C.accent);
            doc.fontSize(8.5).fillColor(C.textMuted).font('Helvetica-Bold')
                .text('PRIMARY DIAGNOSIS', lm + 10, y + 5);
            doc.fontSize(10).fillColor(C.text).font('Helvetica-Bold')
                .text(prescription.diagnosis || '—', lm + 10, y + 16, { width: contentW - 20 });
            y += 40;

            if (prescription.symptoms) {
                doc.fontSize(8.5).fillColor(C.textMuted).font('Helvetica-Bold').text('PRESENTING SYMPTOMS / CHIEF COMPLAINT', lm, y);
                y += 12;
                doc.fontSize(8.5).fillColor(C.text).font('Helvetica')
                    .text(prescription.symptoms, lm + 6, y, { width: contentW - 12 });
                y += doc.heightOfString(prescription.symptoms, { width: contentW - 12 }) + 8;
            }

            if (prescription.notes) {
                doc.fontSize(8.5).fillColor(C.textMuted).font('Helvetica-Bold').text("DOCTOR'S NOTES", lm, y);
                y += 12;
                doc.fontSize(8.5).fillColor(C.text).font('Helvetica')
                    .text(prescription.notes, lm + 6, y, { width: contentW - 12 });
                y += doc.heightOfString(prescription.notes, { width: contentW - 12 }) + 8;
            }
            y += 4;

            if ((prescription.medicines || []).length > 0) {
                if (y > doc.page.height - 180) { doc.addPage(); y = pageHeader(doc, 'PATIENT MEDICAL FILE', 'Continued'); }
                y = sectionHeader(doc, '  PRESCRIBED MEDICATIONS', lm, y, contentW, C.primary);
                const mc = [lm, lm + 140, lm + 230, lm + 310, lm + 380, lm + 450];
                const mHeaders = ['Medicine Name', 'Dosage', 'Frequency', 'Duration', 'Route', 'Instructions'];
                const mWidths = [135, 85, 75, 65, 65, 110];
                doc.rect(lm, y, contentW, 16).fill(C.tableHeader);
                mHeaders.forEach((h, i) => {
                    doc.fontSize(7.5).fillColor(C.white).font('Helvetica-Bold').text(h, mc[i], y + 4, { width: mWidths[i] });
                });
                y += 16;
                prescription.medicines.forEach((med, idx) => {
                    if (y > doc.page.height - 80) { doc.addPage(); y = pageHeader(doc, 'PATIENT MEDICAL FILE', 'Continued'); y += 10; }
                    const rowBg = idx % 2 === 0 ? C.tableBg : C.white;
                    doc.rect(lm, y, contentW, 20).fill(rowBg);
                    const vals = [med.name || med.medicineName || '—', med.dosage || '—', med.frequency || '—', med.duration || '—', 'Oral', med.instructions || 'As prescribed'];
                    vals.forEach((v, i) => { doc.fontSize(8).fillColor(C.text).font('Helvetica').text(v, mc[i] + 2, y + 5, { width: mWidths[i] - 4, ellipsis: true }); });
                    y += 21;
                });
                y += 8;
            }

            const completedTests = (labTests || []).filter(lt => lt.status === 'completed' && lt.results?.length > 0);
            if (completedTests.length > 0) {
                if (y > doc.page.height - 150) { doc.addPage(); y = pageHeader(doc, 'PATIENT MEDICAL FILE', 'Continued'); }
                y = sectionHeader(doc, `  LABORATORY TEST RESULTS (${completedTests.length})`, lm, y, contentW, '#0369a1');
                completedTests.forEach(test => {
                    if (y > doc.page.height - 120) { doc.addPage(); y = pageHeader(doc, 'PATIENT MEDICAL FILE', 'Continued'); }
                    doc.rect(lm, y, contentW, 18).fill('#e0f2fe');
                    doc.rect(lm, y, 3, 18).fill(C.primaryLight);
                    doc.fontSize(9).fillColor(C.primaryLight).font('Helvetica-Bold').text(`Test: ${test.testName}`, lm + 8, y + 4);
                    y += 22;
                    const rc = [lm + 4, lm + 170, lm + 250, lm + 340, lm + 410];
                    const rw = [162, 76, 86, 66, 100];
                    const rH = ['Parameter', 'Value', 'Unit', 'Normal Range', 'Status'];
                    doc.rect(lm, y, contentW, 14).fill('#bae6fd');
                    rH.forEach((h, i) => { doc.fontSize(7).fillColor('#0c4a6e').font('Helvetica-Bold').text(h, rc[i], y + 3, { width: rw[i] }); });
                    y += 14;
                    test.results.forEach((r, ri) => {
                        if (y > doc.page.height - 60) { doc.addPage(); y = pageHeader(doc, 'PATIENT MEDICAL FILE', 'Continued'); }
                        const abnormal = r.isAbnormal || r.flag === 'high' || r.flag === 'low' || r.flag === 'critical';
                        const rowBg = abnormal ? '#fff7ed' : (ri % 2 === 0 ? '#f0f9ff' : C.white);
                        doc.rect(lm, y, contentW, 16).fill(rowBg);
                        const normalRange = r.referenceRange?.normalRange || (r.referenceRange?.min && r.referenceRange?.max ? `${r.referenceRange.min} - ${r.referenceRange.max}` : '—');
                        const rVals = [r.parameter, r.value, r.unit || '—', normalRange];
                        rVals.forEach((v, i) => { doc.fontSize(7.5).fillColor((i === 1 && abnormal) ? C.accentRed : C.text).font((i === 1 && abnormal) ? 'Helvetica-Bold' : 'Helvetica').text(v || '—', rc[i], y + 4, { width: rw[i] }); });
                        doc.fontSize(7.5).fillColor(abnormal ? C.accentRed : C.accent).font('Helvetica-Bold').text((r.flag || 'normal').toUpperCase(), rc[4], y + 4, { width: rw[4] });
                        y += 17;
                    });
                    y += 8;
                });
            }

            if (y > doc.page.height - 100) { doc.addPage(); y = pageHeader(doc, 'PATIENT MEDICAL FILE', 'Continued'); }
            y += 20;
            doc.fontSize(8.5).fillColor(C.textMuted).font('Helvetica').text('Physician Signature', lm, y);
            doc.fontSize(10).fillColor(C.primary).font('Helvetica-Bold').text(`Dr. ${doctor.fullName}`, lm, y + 12);

            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                pageFooter(doc, `Official medical record · Patient: ${patient.fullName}`, `${i - range.start + 1}/${range.count}`);
            }
            doc.end();
            ws.on('finish', () => resolve({ filepath, filename, relativePath: `medical-files/${filename}` }));
        } catch (err) { reject(err); }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
async function generateInsuranceClaimPDF(claim, patient, doctor = null, labTests = []) {
    const claimRef = claim._id.toString().slice(-10).toUpperCase();
    const filename = `insurance-claim-${claimRef}.pdf`;
    const filepath = path.join(INSURANCE_FILES_DIR, filename);

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
            const ws = fs.createWriteStream(filepath);
            doc.pipe(ws);

            const pw = doc.page.width;
            const lm = 40;
            const contentW = pw - lm * 2;
            const patientNameWatermark = (patient?.fullName || 'CareFusion').toUpperCase();

            drawWatermark(doc, patientNameWatermark);
            let y = pageHeader(doc, 'INSURANCE CLAIM FORM', `Ref: ${claim.claimReference || claimRef}`);

            doc.rect(lm, y, contentW, 22).fill('#eff6ff');
            doc.fontSize(9).fillColor(C.primary).font('Helvetica-Bold').text(`STATUS: ${(claim.status || 'draft').toUpperCase()}`, lm + 8, y + 6);
            y += 28;

            y = sectionHeader(doc, '  SECTION A: CLAIM DETAILS', lm, y, contentW);
            const leftDetails = [['Ref', claim.claimReference || claimRef], ['Type', claim.claimType], ['Amount', claim.claimAmount ? `Rs. ${claim.claimAmount}` : null]].filter(p => p[1]);
            const rightDetails = [['Provider', claim.insuranceProvider], ['Policy', claim.policyNumber], ['Review', claim.reviewedAt ? formatDate(claim.reviewedAt) : null]].filter(p => p[1]);
            y = twoColInfoBlock(doc, leftDetails, rightDetails, lm + 6, y + 4, pw);

            y = sectionHeader(doc, '  SECTION B: PATIENT DETAILS', lm, y, contentW);
            y = twoColInfoBlock(doc, [['Name', patient?.fullName], ['Age', patient?.age], ['Gender', patient?.gender]], [['Mobile', patient?.mobile], ['Email', patient?.email]], lm + 6, y + 4, pw);

            y = sectionHeader(doc, '  SECTION C: CLINICAL DATA', lm, y, contentW, C.accent);
            if (claim.clinicalInfo?.diagnosis) {
                const h = Math.max(34, doc.heightOfString(claim.clinicalInfo.diagnosis, { width: contentW - 20 }) + 15);
                doc.rect(lm, y, contentW, h).fill('#f0fdf4').rect(lm, y, 4, h).fill(C.accent);
                doc.fontSize(9.5).fillColor(C.text).font('Helvetica-Bold').text(claim.clinicalInfo.diagnosis, lm + 10, y + 15, { width: contentW - 20 });
                y += h + 6;
            }

            if ((claim.icdCodes || []).length > 0) {
                if (y > doc.page.height - 150) { doc.addPage(); y = pageHeader(doc, 'INSURANCE CLAIM FORM', 'Continued'); }
                y = sectionHeader(doc, `  SECTION D: ICD-10 CODES (${claim.icdCodes.length})`, lm, y, contentW, C.primary);
                claim.icdCodes.forEach((code, idx) => {
                    const rowH = Math.max(18, doc.heightOfString(code.description || '', { width: 300 }) + 10);
                    if (y + rowH > doc.page.height - 60) { doc.addPage(); y = pageHeader(doc, 'INSURANCE CLAIM FORM', 'Continued'); y += 10; }
                    doc.rect(lm, y, contentW, rowH).fill(idx % 2 === 0 ? '#eff6ff' : C.white);
                    doc.fontSize(8).fillColor(C.text).font('Helvetica').text(`${idx + 1}.`, lm + 4, y + 5).font('Helvetica-Bold').text(code.code, lm + 24, y + 5).font('Helvetica').text(code.description, lm + 110, y + 5, { width: 300 });
                    y += rowH + 1;
                });
            }

            if ((claim.cptCodes || []).length > 0) {
                if (y > doc.page.height - 150) { doc.addPage(); y = pageHeader(doc, 'INSURANCE CLAIM FORM', 'Continued'); }
                y = sectionHeader(doc, `  SECTION E: CPT CODES (${claim.cptCodes.length})`, lm, y, contentW, '#059669');
                claim.cptCodes.forEach((code, idx) => {
                    const rowH = Math.max(18, doc.heightOfString(code.description || '', { width: 300 }) + 10);
                    if (y + rowH > doc.page.height - 60) { doc.addPage(); y = pageHeader(doc, 'INSURANCE CLAIM FORM', 'Continued'); y += 10; }
                    doc.rect(lm, y, contentW, rowH).fill(idx % 2 === 0 ? '#f0fdf4' : C.white);
                    doc.fontSize(8).fillColor(C.text).font('Helvetica').text(`${idx + 1}.`, lm + 4, y + 5).font('Helvetica-Bold').text(code.code, lm + 24, y + 5).font('Helvetica').text(code.description, lm + 110, y + 5, { width: 300 });
                    y += rowH + 1;
                });
            }

            if (claim.claimNarrative) {
                const h = doc.heightOfString(claim.claimNarrative, { width: contentW - 20 });
                if (y + h + 50 > doc.page.height - 60) { doc.addPage(); y = pageHeader(doc, 'INSURANCE CLAIM FORM', 'Continued'); }
                y = sectionHeader(doc, '  SECTION F: NARRATIVE', lm, y, contentW);
                doc.fontSize(8.5).fillColor(C.text).font('Helvetica').text(claim.claimNarrative, lm + 10, y + 10, { width: contentW - 20, lineGap: 2 });
                y += h + 25;
            }

            const decText = 'I hereby declare that the information provided in this claim form is true and correct to the best of my knowledge.';
            const decH = doc.heightOfString(decText, { width: contentW - 20 });
            if (y + decH + 100 > doc.page.height - 60) { doc.addPage(); y = pageHeader(doc, 'INSURANCE CLAIM FORM', 'Continued'); }
            y = sectionHeader(doc, '  DECLARATION', lm, y, contentW, C.accentRed);
            doc.fontSize(8).fillColor(C.text).font('Helvetica').text(decText, lm + 10, y + 10);
            y += decH + 40;
            doc.fontSize(8).text('Signature: ___________________', lm, y);

            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                if (i > range.start) drawWatermark(doc, patientNameWatermark);
                pageFooter(doc, `Insurance Claim · ${patient.fullName}`, `${i - range.start + 1}/${range.count}`);
            }
            doc.end();
            ws.on('finish', () => resolve({ filepath, filename, relativePath: `insurance-claims/${filename}` }));
        } catch (err) { reject(err); }
    });
}

module.exports = { generatePatientMedicalFilePDF, generateInsuranceClaimPDF };
