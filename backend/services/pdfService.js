const fs = require('fs');
const path = require('path');

const logFile = path.join(process.cwd(), 'pdf_extraction.log');
const log = (msg) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
};

/**
 * Extract text from a PDF file using pdfjs-dist
 * @param {string} filePath Absolute path to the PDF file
 * @returns {Promise<string>} Extracted text
 */
exports.extractTextFromPDF = async (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            console.error('[PDF Service] File NOT found at:', filePath);
            return '';
        }

        log(`[PDF Service] Attempting to import pdfjs-dist from: pdfjs-dist/legacy/build/pdf.mjs`);
        // Use dynamic import for ESM module in CJS
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        log(`[PDF Service] pdfjs-dist imported successfully`);

        // Set worker path for Node.js
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
            log(`[PDF Service] Set workerSrc to: ${workerPath}`);
        }

        const dataBuffer = fs.readFileSync(filePath);
        const uint8Array = new Uint8Array(dataBuffer);

        log(`[PDF Service] Loading PDF document...`);
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            useSystemFonts: true,
            disableFontFace: true 
        });

        const pdf = await loadingTask.promise;
        log(`[PDF Service] PDF Loaded, pages: ${pdf.numPages}`);
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        log(`[PDF Service] Extraction complete for: ${filePath}`);

        // Clean up the text: remove extra whitespace and newlines
        return fullText
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000); // Limit to 5k chars to avoid blowing up AI context
    } catch (error) {
        log(`[PDF Service] CRITICAL ERROR: ${error.message}\n${error.stack}`);
        console.error('[PDF Service] Error extracting text from PDF:', error);
        return '';
    }
};
