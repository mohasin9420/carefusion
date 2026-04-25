const { getActiveKeyForProvider } = require('../controllers/adminApiKeyController');

/**
 * Get the first active AI key from DB — tries Groq, Mistral, Gemini in order
 */
const getAnyActiveKey = async () => {
    const providers = ['groq', 'mistral', 'gemini', 'openai'];
    for (const provider of providers) {
        const key = await getActiveKeyForProvider(provider);
        if (key) return { provider, key };
    }
    throw new Error('No active AI API key configured. Please add one in Admin → API Keys. (Groq is free: console.groq.com)');
};

/**
 * Robustly extract JSON from AI response
 */
const extractJSON = (text) => {
    if (!text) return null;
    try {
        // 1. Try cleaning markdown backticks first
        const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        // 2. Try finding the first { and last }
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            const jsonPart = text.substring(start, end + 1);
            try {
                return JSON.parse(jsonPart);
            } catch (e2) {
                // 3. Last ditch: try to close a truncated list if it looks like one
                console.warn('AI JSON parsing failed, trying simple repair:', e2.message);
                try {
                    let repaired = jsonPart;
                    const openBraces = (repaired.match(/{/g) || []).length;
                    const closeBraces = (repaired.match(/}/g) || []).length;
                    for (let i = 0; i < (openBraces - closeBraces); i++) repaired += '}';
                    const openBrackets = (repaired.match(/\[/g) || []).length;
                    const closeBrackets = (repaired.match(/]/g) || []).length;
                    for (let i = 0; i < (openBrackets - closeBrackets); i++) repaired += ']';
                    return JSON.parse(repaired);
                } catch (e3) { return null; }
            }
        }
        return null;
    }
};

/**
 * Call Groq API (free tier — uses LLaMA 3)
 */
const callGroq = async (prompt, apiKey) => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 1024,
            ...(prompt.toLowerCase().includes('json') && { response_format: { type: 'json_object' } })
        })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Groq API error: ${err.error?.message || 'Unknown error'}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
};

/**
 * Call Mistral API (free tier)
 */
const callMistral = async (prompt, apiKey) => {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 1024
        })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Mistral API error: ${err.message || 'Unknown error'}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
};

/**
 * Call Gemini API
 */
const callGemini = async (prompt, apiKey) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
                temperature: 0.1, 
                maxOutputTokens: 1024,
                responseMimeType: 'application/json'
            }
        })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Gemini API error: ${err.error?.message || 'Unknown error'}`);
    }
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

/**
 * Call OpenAI API
 */
const callOpenAI = async (prompt, apiKey) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 1024,
            response_format: { type: 'json_object' }
        })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenAI API error: ${err.error?.message || 'Unknown error'}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
};

/**
 * Universal AI caller — uses whichever provider's key is active
 */
const callAI = async (prompt) => {
    const { provider, key } = await getAnyActiveKey();
    switch (provider) {
        case 'groq':    return callGroq(prompt, key);
        case 'mistral': return callMistral(prompt, key);
        case 'gemini':  return callGemini(prompt, key);
        case 'openai':  return callOpenAI(prompt, key);
        default: throw new Error(`Unsupported provider: ${provider}`);
    }
};

/**
 * Generate ICD-10 and CPT codes from clinical information
 */
exports.generateMedicalCodes = async ({ diagnosis, symptoms, medicines, labTestResults, patientAge, patientGender }) => {
    const prompt = `You are a professional medical coder. Based on the following patient information, provide ICD-10 diagnosis codes and CPT procedure codes for an insurance claim.

Patient Information:
- Age: ${patientAge || 'Unknown'}
- Gender: ${patientGender || 'Unknown'}
- Diagnosis/Chief Complaint: ${diagnosis || 'Not specified'}
- Symptoms: ${symptoms || 'Not specified'}
- Medicines Prescribed: ${medicines || 'None'}
- Lab Tests/Results: ${labTestResults || 'None'}

Provide ONLY a valid JSON response. Do not include any explanations before or after the JSON.
Format:
{
  "icdCodes": [
    { "code": "J06.9", "description": "...", "confidence": "high" }
  ],
  "cptCodes": [
    { "code": "99213", "description": "...", "confidence": "high" }
  ],
  "codingNotes": "..."
}
`;

    const rawText = await callAI(prompt);
    const parsed = extractJSON(rawText);
    
    if (parsed) return parsed;

    return {
        icdCodes: [],
        cptCodes: [],
        codingNotes: 'AI coding failed. Please enter codes manually or ensure valid history. Trace: ' + rawText.slice(0, 100)
    };
};

/**
 * Generate a professional insurance claim narrative
 */
exports.generateClaimNarrative = async ({ patientName, patientAge, patientGender, diagnosis, symptoms, treatment, medicines, labTests, icdCodes, cptCodes, visitDate, doctorName }) => {
    const prompt = `You are a professional medical billing specialist. Write a clear, professional insurance claim narrative based on the following information.

Patient: ${patientName || 'Patient'}, ${patientAge || ''}yo ${patientGender || ''}
Visit Date: ${visitDate || 'Recent visit'}
Treating Physician: Dr. ${doctorName || 'Physician'}
Diagnosis: ${diagnosis || 'Not specified'}
Symptoms/Presentation: ${symptoms || 'Not specified'}
Treatment Provided: ${treatment || 'Medical consultation'}
Medicines: ${medicines || 'None'}
Lab Tests: ${labTests || 'None'}
ICD-10 Codes: ${icdCodes || 'To be determined'}
CPT Codes: ${cptCodes || 'To be determined'}

Write a 3-4 paragraph professional claim narrative that:
1. Describes the patient's presentation and medical necessity
2. Details the examination and treatment provided
3. Justifies the medical codes used
4. States the expected outcome/follow-up

Keep it professional and suitable for insurance submission. Do not include any headers or markdown.`;

    return await callAI(prompt);
};

/**
 * Analyze a free-text medical report and extract coding info
 */
exports.analyzeMedicalReport = async (reportText) => {
    const prompt = `You are a medical coding expert. Analyze the following medical report and extract key information for insurance coding.

MEDICAL REPORT:
${reportText}

Provide a JSON response:
{
  "extractedDiagnosis": "primary diagnosis",
  "extractedSymptoms": "key symptoms",
  "extractedProcedures": "procedures performed",
  "suggestedIcdCodes": [{ "code": "X00.0", "description": "..." }],
  "suggestedCptCodes": [{ "code": "99213", "description": "..." }],
  "medicalNecessity": "brief statement of medical necessity",
  "summary": "one sentence summary"
}

Only return the JSON.`;

    const rawText = await callAI(prompt);
    const parsed = extractJSON(rawText);
    if (parsed) return parsed;
    return { error: 'Could not parse report. Trace: ' + (rawText || '').slice(0, 100) };
};

/**
 * Get medicine recommendations based on disease, type, severity, and symptoms
 */
exports.getMedicineRecommendations = async ({ diseaseName, diseaseType, severity, symptoms }) => {
    const prompt = `You are a medical assistant. Based on the following diagnosis, suggest appropriate medicines.
    
    Diagnosis: ${diseaseName}
    Type/Category: ${diseaseType || 'Not specified'}
    Severity: ${severity || 'Mild'}
    Symptoms: ${symptoms || 'Not specified'}
    
    Provide a JSON response with a list of suggested medicines in this exact format:
    {
      "recommendations": [
        { "name": "...", "dosage": "...", "frequency": "...", "duration": "...", "notes": "..." }
      ],
      "cautionNotes": "Important alerts or side effects to watch for"
    }
    
    Only return the JSON, no other text.`;

    const rawText = await callAI(prompt);
    const parsed = extractJSON(rawText);
    if (parsed) return parsed;
    
    return {
        recommendations: [],
        cautionNotes: 'AI suggestions could not be processed. Trace: ' + (rawText || '').slice(0, 100)
    };
};

/**
 * Generate a complete patient profile summary for clinical review
 */
exports.getPatientProfileSummary = async ({ patient, chronicDiseases = [], allergies = [], prescriptions = [], labResults = [], reportFindings = '' }) => {
    const prompt = `You are an expert clinical synthesis assistant. Your goal is to provide a comprehensive patient profile summary by analyzing structured data AND unstructured laboratory report text.
    
    CRITICAL: If "LAB REPORTS" text contains specific findings (e.g., "Low Hemoglobin", "High Sugar", "Abnormal WBC"), prioritize these in the summary!
    
    PATIENT: ${patient.fullName}, ${patient.age}y ${patient.gender}
    CHRONIC CONDITIONS: ${chronicDiseases.join(', ') || 'None'}
    ALLERGIES: ${allergies.join(', ') || 'None'}
    
    RECENT PRESCRIPTIONS:
    ${prescriptions.map(p => `- ${p.date}: ${p.diagnosis} (${p.medicines})`).join('\n')}
    
    LAB RESULTS (Structured):
    ${labResults.map(l => `- ${l.testName}: ${l.result}`).join('\n')}
    
    LAB REPORTS (Parsed Text/Findings):
    ${reportFindings || 'No detailed reports available for text analysis.'}
    
    Provide a structured clinical dashboard JSON response:
    {
      "overview": "Concise 1-2 sentence status overview",
      "clinicalInsights": [
        { "category": "Category (e.g. Hematology)", "finding": "Specific finding from lab reports/data" }
      ],
      "treatmentHistory": [
        { "date": "Date", "event": "Medication/Diagnosis summary" }
      ],
      "criticalAlerts": ["High-priority warning 1", "High-priority warning 2"]
    }
    
    Only return the JSON.`;

    const rawText = await callAI(prompt);
    const parsed = extractJSON(rawText);
    if (parsed) return parsed;

    return {
        overview: 'Manual Review Required: Systematic clinical synthesis failed.',
        clinicalInsights: [],
        treatmentHistory: [],
        criticalAlerts: ['AI verification failed. Please check full reports and prescriptions manually.'],
        reportAnalysis: 'Analysis failed.'
    };
};
