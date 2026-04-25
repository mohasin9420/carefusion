import { useState, useEffect, useCallback } from 'react';
import { staffAPI, insuranceAPI } from '../../services/api';
import InsuranceClaimAssistant from '../Doctor/InsuranceClaimAssistant';

/* ─────────────────────────────────────────────────────────────
   Status badge helper
───────────────────────────────────────────────────────────── */
const STATUS_META = {
    draft:        { bg: '#f1f5f9', color: '#475569', icon: '📝', label: 'Draft' },
    submitted:    { bg: '#eff6ff', color: '#1d4ed8', icon: '📤', label: 'Submitted' },
    under_review: { bg: '#fef3c7', color: '#d97706', icon: '🔍', label: 'Under Review' },
    approved:     { bg: '#dcfce7', color: '#15803d', icon: '✅', label: 'Approved' },
    rejected:     { bg: '#fef2f2', color: '#dc2626', icon: '❌', label: 'Rejected' },
    paid:         { bg: '#d1fae5', color: '#059669', icon: '💰', label: 'Paid' },
};

const StatusBadge = ({ status }) => {
    const m = STATUS_META[status] || STATUS_META.draft;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: m.bg, color: m.color }}>
            {m.icon} {m.label}
        </span>
    );
};

const ClaimTypeBadge = ({ type }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: type === 'cashless' ? '#dbeafe' : '#fce7f3', color: type === 'cashless' ? '#1e40af' : '#9d174d', marginLeft: 6 }}>
        {type === 'cashless' ? '🏥 Cashless' : '💵 Reimbursement'}
    </span>
);

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
const StaffInsuranceClaims = () => {
    const [activeTab, setActiveTab] = useState('file');

    const tabStyle = (tab) => ({
        padding: '0.65rem 1.4rem',
        border: 'none',
        borderBottom: activeTab === tab ? '3px solid #2563eb' : '3px solid transparent',
        background: 'none',
        fontWeight: activeTab === tab ? 700 : 500,
        color: activeTab === tab ? '#2563eb' : '#64748b',
        cursor: 'pointer',
        fontSize: '0.95rem',
        borderRadius: 0,
        transition: 'all 0.2s',
    });

    return (
        <div className="insurance-claims-dashboard">
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1 className="m-0">Insurance & Claims</h1>
                    <p className="text-gray-500 font-medium">Process cashless approvals and reimbursement documentation.</p>
                </div>
                <div className="flex gap-md">
                     <button 
                        className={`btn btn-sm ${activeTab === 'file' ? 'btn-primary' : 'btn-outline-secondary'}`} 
                        onClick={() => setActiveTab('file')}
                        style={{ borderRadius: '20px', padding: '8px 20px' }}
                    >
                        📝 File New Claim
                    </button>
                    <button 
                        className={`btn btn-sm ${activeTab === 'manage' ? 'btn-primary' : 'btn-outline-secondary'}`} 
                        onClick={() => setActiveTab('manage')}
                        style={{ borderRadius: '20px', padding: '8px 20px' }}
                    >
                        📋 Audit Claims
                    </button>
                </div>
            </div>

            {activeTab === 'file' && <FileClaimTab />}
            {activeTab === 'manage' && <ManageClaimsTab />}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Tab 1 — File New Claim
───────────────────────────────────────────────────────────── */
const FileClaimTab = () => {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null); // null = Myself, else the member object
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPrescriptions, setSelectedPrescriptions] = useState([]); // changed from single object
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        staffAPI.getPatients()
            .then(res => setPatients(res.data))
            .catch(() => setError('Failed to load patients'))
            .finally(() => setLoadingPatients(false));
    }, []);

    const handleSelectPatient = async (patient) => {
        setSelectedPatient(patient);
        setSelectedMember(null); // Reset to Myself
        setSelectedPrescriptions([]);
        setPrescriptions([]);
    };

    const fetchPrescriptions = useCallback(async () => {
        if (!selectedPatient) return;
        setLoadingPrescriptions(true);
        try {
            const memberId = selectedMember?._id || 'null';
            const res = await insuranceAPI.getPatientPrescriptions(selectedPatient._id, memberId);
            setPrescriptions(res.data);
        } catch (err) {
            setError('Failed to load prescriptions for this beneficiary');
        } finally {
            setLoadingPrescriptions(false);
        }
    }, [selectedPatient, selectedMember]);

    useEffect(() => {
        if (selectedPatient) fetchPrescriptions();
    }, [selectedPatient, selectedMember, fetchPrescriptions]);

    const filteredPatients = patients.filter(p =>
        !searchQuery ||
        p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.mobile?.includes(searchQuery) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 16 };
    const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' };

    return (
        <div>
            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{error}</div>
            )}

            {/* Step 1: Select Patient */}
            <div className="card p-xl mb-lg" style={{ borderLeft: '4px solid #2563eb' }}>
                <div className="flex items-center gap-md mb-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                    <h3 className="m-0 text-lg">Identify Patient Participant</h3>
                </div>
                <div className="relative mb-lg">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name, ID, or mobile number…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                {loadingPatients ? (
                    <div className="spinner-sm mx-auto"></div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto border border-gray-100 rounded-xl bg-gray-50 p-2 grid grid-2 gap-sm">
                        {filteredPatients.length === 0 ? (
                            <div className="p-xl text-center text-gray-400 col-span-2">No patients matched your audit parameters.</div>
                        ) : filteredPatients.map(p => (
                            <div
                                key={p._id}
                                onClick={() => handleSelectPatient(p)}
                                className={`p-md rounded-lg cursor-pointer transition-all border-2 ${selectedPatient?._id === p._id ? 'border-blue-600 bg-blue-50' : 'border-transparent bg-white hover:bg-gray-100'}`}
                            >
                                <div className="font-bold text-gray-900">{p.fullName}</div>
                                <div className="text-xs text-gray-500 flex justify-between mt-1">
                                    <span>{p.mobile}</span>
                                    <span>{p.gender} | {p.age}Y</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Step 2: Select Beneficiary */}
            {selectedPatient && (
                <div className="card p-xl mb-lg" style={{ borderLeft: '4px solid #10b981' }}>
                    <div className="flex items-center gap-md mb-lg">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">2</div>
                        <h3 className="m-0 text-lg">Select Beneficiary</h3>
                    </div>
                    <div className="grid grid-3 gap-md">
                        <div 
                            onClick={() => setSelectedMember(null)}
                            className={`p-lg rounded-xl cursor-pointer transition-all border-2 text-center ${selectedMember === null ? 'border-green-600 bg-green-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                        >
                            <div className="text-3xl mb-2">👤</div>
                            <div className="font-bold">Myself</div>
                            <div className="text-xs text-gray-500">Account Holder</div>
                        </div>
                        {(selectedPatient.familyMembers || []).map(m => (
                            <div 
                                key={m._id}
                                onClick={() => setSelectedMember(m)}
                                className={`p-lg rounded-xl cursor-pointer transition-all border-2 text-center ${selectedMember?._id === m._id ? 'border-green-600 bg-green-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                            >
                                <div className="text-3xl mb-2">👨‍👩‍👧</div>
                                <div className="font-bold">{m.name}</div>
                                <div className="text-xs text-gray-500 capitalize">{m.relation}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Select Prescription */}
            {selectedPatient && (
                <div className="card p-xl mb-lg" style={{ borderLeft: '4px solid #7c3aed' }}>
                    <div className="flex items-center gap-md mb-lg">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">3</div>
                        <h3 className="m-0 text-lg">Select Associated Encounters</h3>
                    </div>
                    {loadingPrescriptions ? (
                        <div className="spinner-sm mx-auto"></div>
                    ) : (
                        <div className="grid grid-2 gap-md">
                            {prescriptions.length === 0 ? (
                                <div className="p-xl text-center bg-gray-50 rounded-xl col-span-2 border-2 border-dashed">
                                    <p className="text-gray-400">No medical encounters found for this profile.</p>
                                </div>
                            ) : prescriptions.map(rx => (
                                <div
                                    key={rx._id}
                                    onClick={() => {
                                        const isSelected = selectedPrescriptions.some(p => p._id === rx._id);
                                        setSelectedPrescriptions(prev => 
                                            isSelected ? prev.filter(p => p._id !== rx._id) : [...prev, rx]
                                        );
                                    }}
                                    className={`p-lg rounded-xl cursor-pointer transition-all border-2 flex items-start gap-md ${selectedPrescriptions.some(p => p._id === rx._id) ? 'border-purple-600 bg-purple-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                                >
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 mb-1">{rx.diagnosis}</div>
                                        <div className="text-xs text-gray-500 flex flex-col gap-1">
                                            <span>👨‍⚕️ Dr. {rx.doctorId?.fullName}</span>
                                            <span>📅 {new Date(rx.appointmentId?.appointmentDate || rx.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    {selectedPrescriptions.some(p => p._id === rx._id) && (
                                        <div className="text-purple-600 text-xl font-bold">✓</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: AI Claim Generator */}
            {selectedPatient && selectedPrescriptions.length > 0 && (
                <div>
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 14, color: '#15803d', fontWeight: 600 }}>
                        ✅ Generating claim for <strong>{selectedMember ? selectedMember.name : selectedPatient.fullName}</strong> — 
                        Prescriptions: <strong>{selectedPrescriptions.map(p => p.diagnosis).join(', ')}</strong>
                    </div>
                    <InsuranceClaimAssistant
                        patient={selectedMember ? {
                            _id: selectedPatient._id,
                            fullName: selectedMember.name,
                            age: selectedMember.age,
                            gender: selectedMember.gender
                        } : selectedPatient}
                        memberId={selectedMember?._id}
                        prescriptions={selectedPrescriptions}
                        showInsuranceFields={true}
                        defaultClaimType="cashless"
                    />
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Tab 2 — Manage All Claims
───────────────────────────────────────────────────────────── */
const ManageClaimsTab = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [expanded, setExpanded] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [updateForm, setUpdateForm] = useState({});

    const fetchClaims = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (filterStatus !== 'all') params.status = filterStatus;
            if (filterType !== 'all') params.claimType = filterType;
            const res = await insuranceAPI.getAllClaims(params);
            setClaims(res.data.claims || []);
        } catch (err) {
            setError('Failed to load claims');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterType]);

    useEffect(() => { fetchClaims(); }, [fetchClaims]);

    const handleUpdateStatus = async (claimId, status) => {
        setUpdatingId(claimId);
        try {
            const form = updateForm[claimId] || {};
            await insuranceAPI.updateClaimStatus(claimId, {
                status,
                approvedAmount: form.approvedAmount ? parseFloat(form.approvedAmount) : undefined,
                rejectionReason: form.rejectionReason || undefined
            });
            await fetchClaims();
            setExpanded(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const downloadPdf = async (apiFn, filename, claimId) => {
        setUpdatingId(claimId);
        setError('');
        try {
            const res = await apiFn();
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download PDF');
        } finally {
            setUpdatingId(null);
        }
    };

    const setField = (id, field, value) => setUpdateForm(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));

    const s = {
        card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 12 },
        input: { padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' },
        select: { padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' },
    };

    return (
        <div>
            {/* Audit Filters */}
            <div className="flex gap-md mb-xl flex-wrap items-center">
                <div className="form-group mb-0">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input" style={{ width: 'auto' }}>
                        <option value="all">Any Status</option>
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Review Phase</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="paid">Finalized / Paid</option>
                    </select>
                </div>
                <div className="form-group mb-0">
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input" style={{ width: 'auto' }}>
                        <option value="all">Any Claim Type</option>
                        <option value="cashless">🏥 Cashless Only</option>
                        <option value="reimbursement">💵 Reimbursement</option>
                    </select>
                </div>
                <button onClick={fetchClaims} className="btn btn-outline-primary" style={{ height: '40px' }}>🔄 Reload Audit</button>
                <div className="ml-auto m-badge m-badge-blue p-sm px-md">Audit Pool: {claims.length} Records</div>
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{error}</div>}

            {loading ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading claims…</p>
            ) : claims.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                    <p style={{ fontSize: 40, margin: '0 0 12px' }}>📄</p>
                    <p style={{ color: '#64748b', fontSize: 15 }}>No claims found with selected filters.</p>
                </div>
            ) : (
                claims.map(claim => (
                    <div key={claim._id} className="card p-0 overflow-hidden mb-lg shadow-sm border-none transition-all hover:shadow-md" style={{ borderRadius: '24px', background: 'white', border: '1px solid #f1f5f9' }}>
                        <div className="p-xl flex gap-xl mobile-stack">
                            {/* Left: Claim Header */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-lg">
                                    <div>
                                        <h3 className="m-0 text-xl font-extrabold text-gray-900">{claim.patientId?.fullName || 'Anonymous Profile'}</h3>
                                        <div className="flex gap-2 mt-2">
                                            <span className={`m-badge ${claim.claimType === 'cashless' ? 'm-badge-blue' : 'm-badge-purple'}`}>
                                                {claim.claimType.toUpperCase()}
                                            </span>
                                            <span className={`m-badge ${
                                                claim.status === 'paid' ? 'm-badge-green' :
                                                claim.status === 'rejected' ? 'm-badge-red' :
                                                claim.status === 'approved' ? 'm-badge-green' : 'm-badge-yellow'
                                            }`}>
                                                {claim.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-indigo-600">₹{claim.claimAmount?.toLocaleString()}</div>
                                        <div className="text-xs text-gray-400 font-bold uppercase">Requested Assets</div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-2 gap-md p-lg bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex flex-col">
                                        <label className="profile-label text-[10px] text-indigo-400">PROVIDER</label>
                                        <span className="font-bold text-sm">🏢 {claim.insuranceProvider || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="profile-label text-[10px] text-indigo-400">FILED ON</label>
                                        <span className="font-bold text-sm">📅 {new Date(claim.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="profile-label text-[10px] text-indigo-400">POLICY NO</label>
                                        <span className="font-bold text-sm font-mono">{claim.policyNumber || 'NO RECORD'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="profile-label text-[10px] text-indigo-400">DIAGNOSIS</label>
                                        <span className="font-bold text-sm text-gray-700 truncate">{claim.clinicalInfo?.diagnosis || 'General Treatment'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Quick Actions */}
                            <div className="flex flex-col gap-md justify-center border-l border-gray-100 pl-xl mobile-full-width" style={{ minWidth: '280px', borderLeft: '1px solid #f1f5f9' }}>
                                <button
                                    onClick={() => setExpanded(expanded === claim._id ? null : claim._id)}
                                    className="btn btn-primary w-full shadow-md" style={{ background: '#1e293b' }}
                                >
                                    {expanded === claim._id ? 'Close Audit View' : 'Audit Details & ICD'}
                                </button>
                                <div className="grid grid-2 gap-sm">
                                    <button
                                        onClick={() => downloadPdf(
                                            () => insuranceAPI.downloadMedicalFilePDF(claim.prescriptionId?._id || claim.prescriptionId || claim.prescriptionIds?.[0]),
                                            `medical-file-${claim.patientId?.fullName?.replace(/\s/g, '-') || 'patient'}.pdf`,
                                            claim._id
                                        )}
                                        disabled={updatingId === claim._id}
                                        className="btn btn-sm btn-outline-secondary font-bold"
                                    >
                                        {updatingId === claim._id ? '...' : '📜 Medical'}
                                    </button>
                                    <button
                                        onClick={() => downloadPdf(
                                            () => insuranceAPI.downloadInsuranceClaimPDF(claim._id),
                                            `insurance-claim-${claim._id.slice(-8)}.pdf`,
                                            claim._id
                                        )}
                                        disabled={updatingId === claim._id}
                                        className="btn btn-sm btn-outline-primary font-bold"
                                    >
                                        {updatingId === claim._id ? '...' : '🗳️ Claim PDF'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Expanded details + update form */}
                        {expanded === claim._id && (
                            <div style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                                {/* ICD/CPT codes */}
                                {claim.icdCodes?.length > 0 && (
                                    <div style={{ marginBottom: 10 }}>
                                        <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ICD-10 Diagnostic Codes:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {claim.icdCodes.map((c, i) => (
                                                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: 10, padding: '5px 12px', fontSize: 12, fontWeight: 700, boxShadow: '0 2px 4px rgba(30, 64, 175, 0.05)' }}>
                                                    <span style={{ opacity: 0.6, marginRight: 6 }}>🏷️</span> {c.code} — {c.description}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {claim.cptCodes?.length > 0 && (
                                    <div style={{ marginBottom: 10 }}>
                                        <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', margin: '12px 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CPT Procedure Codes:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {claim.cptCodes.map((c, i) => (
                                                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 10, padding: '5px 12px', fontSize: 12, fontWeight: 700, boxShadow: '0 2px 4px rgba(21, 128, 61, 0.05)' }}>
                                                    <span style={{ opacity: 0.6, marginRight: 6 }}>🧪</span> {c.code} — {c.description}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {claim.claimNarrative && (
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 12, whiteSpace: 'pre-wrap', maxHeight: 150, overflowY: 'auto' }}>
                                        {claim.claimNarrative}
                                    </div>
                                )}
                                {claim.rejectionReason && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                                        <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}><strong>Rejection Reason:</strong> {claim.rejectionReason}</p>
                                    </div>
                                )}

                                {/* Status update form */}
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                                    <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', margin: '0 0 10px' }}>🔄 Update Claim Status</p>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                                        <div>
                                            <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 4 }}>Approved Amount (₹)</label>
                                            <input
                                                type="number"
                                                placeholder="e.g. 8000"
                                                value={(updateForm[claim._id] || {}).approvedAmount || ''}
                                                onChange={e => setField(claim._id, 'approvedAmount', e.target.value)}
                                                style={{ ...s.input, width: 140 }}
                                            />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 200 }}>
                                            <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 4 }}>Rejection Reason</label>
                                            <input
                                                type="text"
                                                placeholder="(if rejecting)"
                                                value={(updateForm[claim._id] || {}).rejectionReason || ''}
                                                onChange={e => setField(claim._id, 'rejectionReason', e.target.value)}
                                                style={{ ...s.input, width: '100%', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {['submitted', 'under_review', 'approved', 'rejected', 'paid'].map(st => {
                                            const m = STATUS_META[st];
                                            return (
                                                <button
                                                    key={st}
                                                    disabled={updatingId === claim._id || claim.status === st}
                                                    onClick={() => handleUpdateStatus(claim._id, st)}
                                                    style={{
                                                        padding: '6px 14px', borderRadius: 8, border: 'none', cursor: claim.status === st ? 'default' : 'pointer',
                                                        fontWeight: 700, fontSize: 12, background: claim.status === st ? '#e2e8f0' : m.bg,
                                                        color: claim.status === st ? '#94a3b8' : m.color, transition: 'all 0.15s'
                                                    }}
                                                >
                                                    {m.icon} Set {m.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default StaffInsuranceClaims;
