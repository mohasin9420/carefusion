import { useState } from 'react';
import { insuranceAPI } from '../../services/api';

// Shared PDF blob downloader
const downloadPdfBlob = async (apiFn, filename) => {
    const res = await apiFn();
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

const InsuranceClaimAssistant = ({
    appointment,
    prescriptions = [], // changed from single prescription
    patient,
    memberId = null, // new prop for family member support
    showInsuranceFields = false,  // when true shows provider/policy fields
    defaultClaimType = 'cashless'
}) => {
    const [step, setStep] = useState(1); // 1=generate codes, 2=narrative, 3=review
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [codes, setCodes] = useState(null);
    const [narrative, setNarrative] = useState('');
    const [editedNarrative, setEditedNarrative] = useState('');
    const [claimAmount, setClaimAmount] = useState('');
    const [claimType, setClaimType] = useState(defaultClaimType);
    const [insuranceProvider, setInsuranceProvider] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [membershipId, setMembershipId] = useState('');
    const [saveMsg, setSaveMsg] = useState('');
    const [savedClaimId, setSavedClaimId] = useState(null);
    const [claimReference, setClaimReference] = useState('');
    const [shareWithPatient, setShareWithPatient] = useState(false);

    const handleGenerateCodes = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await insuranceAPI.generateCodes({
                patientId: patient?._id || appointment?.patientId,
                memberId: memberId,
                appointmentId: appointment?._id,
                prescriptionIds: prescriptions.map(p => p._id),
                diagnosis: prescriptions.map(p => p.diagnosis).filter(Boolean).join(', '),
                symptoms: prescriptions.map(p => p.symptoms).filter(Boolean).join(', ')
            });
            setCodes(res.data.codes);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate codes. Ensure an AI API key is configured in Admin → API Keys.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateNarrative = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await insuranceAPI.generateNarrative({
                patientId: patient?._id || appointment?.patientId,
                memberId: memberId,
                appointmentId: appointment?._id,
                prescriptionIds: prescriptions.map(p => p._id),
                icdCodes: codes?.icdCodes,
                cptCodes: codes?.cptCodes,
                visitDate: appointment?.appointmentDate || (prescriptions[0]?.appointmentId?.appointmentDate),
                diagnosis: prescriptions.map(p => p.diagnosis).filter(Boolean).join(', '),
                symptoms: prescriptions.map(p => p.symptoms).filter(Boolean).join(', ')
            });
            setNarrative(res.data.narrative);
            setEditedNarrative(res.data.narrative);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate narrative.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveClaim = async (status = 'draft') => {
        setLoading(true);
        setError('');
        setSaveMsg('');
        try {
            const res = await insuranceAPI.saveClaim({
                claimId: savedClaimId || undefined,
                patientId: patient?._id || appointment?.patientId,
                memberId: memberId,
                appointmentId: appointment?._id,
                prescriptionIds: prescriptions.map(p => p._id),
                icdCodes: codes?.icdCodes,
                cptCodes: codes?.cptCodes,
                codingNotes: codes?.codingNotes,
                claimNarrative: editedNarrative,
                clinicalInfo: {
                    diagnosis: prescriptions.map(p => p.diagnosis).filter(Boolean).join(', '),
                    symptoms: prescriptions.map(p => p.symptoms).filter(Boolean).join(', '),
                    medicines: prescriptions.flatMap(p => (p.medicines || []).map(m => m.medicineName || m.name)).join(', ')
                },
                status,
                claimAmount: claimAmount ? parseFloat(claimAmount) : undefined,
                claimType,
                insuranceProvider: insuranceProvider || undefined,
                policyNumber: policyNumber || undefined,
                membershipId: membershipId || undefined,
                shareWithPatient
            });
            if (res.data.claim?._id) setSavedClaimId(res.data.claim._id);
            if (res.data.claim?.claimReference) setClaimReference(res.data.claim.claimReference);
            setSaveMsg(status === 'submitted' ? '✅ Claim submitted successfully!' : '✅ Draft saved successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save claim.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadFile = async () => {
        if (!savedClaimId) {
            setError('Save or submit the claim first to download the claim file.');
            return;
        }
        try {
            const res = await insuranceAPI.getClaimFile(savedClaimId);
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `insurance_claim_${savedClaimId.slice(-8)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download claim file.');
        }
    };

    const s = {
        container: { fontFamily: 'Inter, sans-serif', maxWidth: 820 },
        card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 16 },
        badge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 12 },
        stepper: { display: 'flex', gap: 8, marginBottom: 20 },
        step: (active, done) => ({ flex: 1, padding: '10px', textAlign: 'center', borderRadius: 8, fontSize: 13, fontWeight: 600, background: done ? '#dcfce7' : active ? '#eff6ff' : '#f8fafc', color: done ? '#15803d' : active ? '#1d4ed8' : '#94a3b8', border: done ? '1px solid #86efac' : active ? '2px solid #2563eb' : '1px solid #e2e8f0' }),
        btn: { padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
        codeChip: { display: 'inline-block', background: '#eff6ff', border: '1px solid #93c5fd', color: '#1e40af', borderRadius: 6, padding: '6px 12px', margin: '4px', fontSize: 13, fontWeight: 600 },
        input: { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
        label: { fontSize: 13, color: '#475569', display: 'block', marginBottom: 4, fontWeight: 600 },
        row: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 },
        col: { flex: 1, minWidth: 160 }
    };

    return (
        <div style={s.container}>
            <div style={s.card}>
                <div style={s.badge}>🤖 AI Insurance Claim Assistant</div>
                <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: 18 }}>Insurance Claim Generator</h3>
                <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 16px' }}>
                    Patient: <strong>{patient?.fullName || '—'}</strong> &nbsp;|&nbsp;
                    Diagnosis: <strong>{prescriptions.map(p => p.diagnosis).join(', ') || '—'}</strong>
                </p>

                {/* Stepper */}
                <div style={s.stepper}>
                    {['1. Generate Codes', '2. Narrative', '3. Review & Save'].map((label, i) => (
                        <div key={i} style={s.step(step === i + 1, step > i + 1)}>{label}</div>
                    ))}
                </div>

                {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{error}</div>}

                {/* Insurance Info Fields (optional, shown when showInsuranceFields=true) */}
                {showInsuranceFields && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', margin: '0 0 12px' }}>🏥 Insurance Details</p>
                        <div style={s.row}>
                            <div style={s.col}>
                                <label style={s.label}>Claim Type</label>
                                <select value={claimType} onChange={e => setClaimType(e.target.value)} style={s.input}>
                                    <option value="cashless">Cashless (Hospital files)</option>
                                    <option value="reimbursement">Reimbursement (Patient pays first)</option>
                                </select>
                            </div>
                            <div style={s.col}>
                                <label style={s.label}>Insurance Provider</label>
                                <input type="text" value={insuranceProvider} onChange={e => setInsuranceProvider(e.target.value)} placeholder="e.g. Star Health, HDFC Ergo" style={s.input} />
                            </div>
                        </div>
                        <div style={s.row}>
                            <div style={s.col}>
                                <label style={s.label}>Policy Number</label>
                                <input type="text" value={policyNumber} onChange={e => setPolicyNumber(e.target.value)} placeholder="e.g. HDFC-2024-001234" style={s.input} />
                            </div>
                            <div style={s.col}>
                                <label style={s.label}>Membership / TPA ID</label>
                                <input type="text" value={membershipId} onChange={e => setMembershipId(e.target.value)} placeholder="e.g. 12345XYZ" style={s.input} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 1: Generate Codes */}
                {step === 1 && (
                    <div>
                        <p style={{ color: '#475569', fontSize: 14, marginBottom: 16 }}>
                            Click to generate ICD-10 diagnosis codes and CPT procedure codes using AI based on the patient's diagnosis, symptoms, medicines, and lab test results.
                        </p>
                        <button onClick={handleGenerateCodes} disabled={loading} style={{ ...s.btn, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff' }}>
                            {loading ? '⏳ Generating Codes...' : '🔬 Generate ICD-10 & CPT Codes'}
                        </button>
                    </div>
                )}

                {/* Step 2: Show Codes + Generate Narrative */}
                {step >= 2 && codes && (
                    <div>
                        <h4 style={{ color: '#1e293b', marginBottom: 8, fontSize: 15 }}>📋 AI-Suggested ICD-10 Codes</h4>
                        <div style={{ marginBottom: 12 }}>
                            {codes.icdCodes?.map((c, i) => (
                                <span key={i} style={s.codeChip} title={c.description}>{c.code} — {c.description}</span>
                            ))}
                        </div>
                        <h4 style={{ color: '#1e293b', marginBottom: 8, fontSize: 15 }}>⚕️ AI-Suggested CPT Codes</h4>
                        <div style={{ marginBottom: 12 }}>
                            {codes.cptCodes?.map((c, i) => (
                                <span key={i} style={{ ...s.codeChip, background: '#f0fdf4', borderColor: '#86efac', color: '#15803d' }} title={c.description}>{c.code} — {c.description}</span>
                            ))}
                        </div>
                        {codes.codingNotes && <p style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic', marginBottom: 12 }}>📝 {codes.codingNotes}</p>}
                        {step === 2 && (
                            <button onClick={handleGenerateNarrative} disabled={loading} style={{ ...s.btn, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff' }}>
                                {loading ? '⏳ Generating Narrative...' : '📄 Generate Claim Narrative'}
                            </button>
                        )}
                    </div>
                )}

                {/* Step 3: Narrative + Save */}
                {step === 3 && (
                    <div>
                        <h4 style={{ color: '#1e293b', marginBottom: 8, fontSize: 15 }}>📄 AI-Generated Claim Narrative</h4>
                        <p style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>You can edit the narrative before saving.</p>
                        <textarea
                            value={editedNarrative}
                            onChange={e => setEditedNarrative(e.target.value)}
                            rows={10}
                            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
                            <div>
                                <label style={s.label}>Claim Amount (₹)</label>
                                <input type="number" value={claimAmount} onChange={e => setClaimAmount(e.target.value)} placeholder="e.g. 5000" style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, width: 140 }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, marginTop: 20 }}>
                                <input 
                                    type="checkbox" 
                                    id="shareWithPatient" 
                                    checked={shareWithPatient} 
                                    onChange={e => setShareWithPatient(e.target.checked)} 
                                    style={{ cursor: 'pointer', width: 18, height: 18 }}
                                />
                                <label htmlFor="shareWithPatient" style={{ ...s.label, marginBottom: 0, cursor: 'pointer' }}>
                                    Share with Patient Dashboard
                                </label>
                            </div>
                            <button onClick={() => handleSaveClaim('draft')} disabled={loading} style={{ ...s.btn, background: '#f1f5f9', color: '#334155', border: '1px solid #d1d5db' }}>
                                💾 Save Draft
                            </button>
                            <button onClick={() => handleSaveClaim('submitted')} disabled={loading} style={{ ...s.btn, background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff' }}>
                                🚀 Submit Claim
                            </button>
                            {savedClaimId && (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => downloadPdfBlob(
                                            () => insuranceAPI.downloadMedicalFilePDF(prescriptions[0]?._id),
                                            `medical-file-${patient?.fullName?.replace(/\s/g, '-') || 'patient'}.pdf`
                                        )}
                                        style={{ ...s.btn, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', fontSize: 13 }}
                                    >
                                        📋 Medical File PDF
                                    </button>
                                    <button
                                        onClick={() => downloadPdfBlob(
                                            () => insuranceAPI.downloadInsuranceClaimPDF(savedClaimId),
                                            `insurance-claim-${claimReference || savedClaimId.slice(-8)}.pdf`
                                        )}
                                        style={{ ...s.btn, background: 'linear-gradient(135deg,#0284c7,#0369a1)', color: '#fff', fontSize: 13 }}
                                    >
                                        📑 Insurance Claim PDF
                                    </button>
                                </div>
                            )}
                        </div>
                        {claimReference && (
                            <div style={{ marginTop: 16, padding: 16, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: 12, color: '#0369a1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Reference</p>
                                    <p style={{ margin: '4px 0 0', fontSize: 18, color: '#0369a1', fontWeight: 800, fontFamily: 'monospace' }}>{claimReference}</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        const url = `${window.location.origin}/verify-claim/${claimReference}`;
                                        navigator.clipboard.writeText(url);
                                        setSaveMsg('✅ Verification link copied to clipboard!');
                                        setTimeout(() => setSaveMsg(''), 3000);
                                    }}
                                    style={{ padding: '8px 16px', background: '#fff', border: '2px solid #7dd3fc', borderRadius: 10, fontSize: 12, cursor: 'pointer', fontWeight: 700, color: '#0369a1', transition: 'all 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#e0f2fe'}
                                    onMouseOut={e => e.currentTarget.style.background = '#fff'}
                                >
                                    🔗 Copy Public Link
                                </button>
                            </div>
                        )}
                        {saveMsg && <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 12 }}>{saveMsg}</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InsuranceClaimAssistant;
