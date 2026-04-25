import { useState, useEffect } from 'react';
import { insuranceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_META = {
    draft:        { bg: '#f1f5f9', color: '#475569', icon: '📝' },
    submitted:    { bg: '#eff6ff', color: '#1d4ed8', icon: '📤' },
    under_review: { bg: '#fef3c7', color: '#d97706', icon: '🔍' },
    approved:     { bg: '#dcfce7', color: '#15803d', icon: '✅' },
    rejected:     { bg: '#fef2f2', color: '#dc2626', icon: '❌' },
    paid:         { bg: '#d1fae5', color: '#059669', icon: '💰' }
};

const timeline = ['draft', 'submitted', 'under_review', 'approved', 'paid'];

const PatientClaims = () => {
    const { user } = useAuth();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadError, setDownloadError] = useState('');

    useEffect(() => {
        const fetchClaims = async () => {
            try {
                const patientId = user?.profile?._id;
                if (!patientId) return;
                const res = await insuranceAPI.getPatientClaims(patientId);
                setClaims(res.data);
            } catch (err) {
                console.error('Failed to load claims', err);
            } finally {
                setLoading(false);
            }
        };
        fetchClaims();
    }, [user]);

    const downloadPdf = async (apiFn, filename, e) => {
        e.stopPropagation();
        setDownloadingId(filename);
        setDownloadError('');
        try {
            const res = await apiFn();
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setDownloadError('Download failed. The claim must be saved before downloading.');
        } finally {
            setDownloadingId(null);
        }
    };

    const s = {
        container: { fontFamily: 'Inter, sans-serif', padding: '20px 0' },
        header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
        title: { fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 },
        card: {
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: 20, marginBottom: 12, cursor: 'pointer',
            transition: 'box-shadow 0.2s, border-color 0.2s'
        },
        badge: (status) => ({
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
            borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: STATUS_META[status]?.bg || '#f1f5f9',
            color: STATUS_META[status]?.color || '#475569'
        }),
        typeBadge: (type) => ({
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 12,
            fontSize: 11, fontWeight: 700, marginLeft: 6,
            background: type === 'cashless' ? '#dbeafe' : '#fce7f3',
            color: type === 'cashless' ? '#1e40af' : '#9d174d'
        }),
        chip: (color = '#eff6ff', border = '#93c5fd', text = '#1e40af') => ({
            display: 'inline-block', background: color, border: `1px solid ${border}`,
            color: text, borderRadius: 6, padding: '4px 10px', margin: '3px', fontSize: 12, fontWeight: 600
        })
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading claims…</div>;

    return (
        <div style={s.container}>
            <div style={s.header}>
                <span style={{ fontSize: 28 }}>🏥</span>
                <div>
                    <h2 style={s.title}>My Insurance Claims</h2>
                    <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                        {claims.length} claim{claims.length !== 1 ? 's' : ''} found
                    </p>
                </div>
            </div>

            {downloadError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{downloadError}</div>
            )}

            {claims.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                    <p style={{ fontSize: 40, margin: '0 0 12px' }}>📄</p>
                    <p style={{ color: '#64748b', fontSize: 15 }}>No insurance claims found.</p>
                    <p style={{ color: '#94a3b8', fontSize: 13 }}>Your doctor or hospital staff can generate a claim after your appointment.</p>
                </div>
            ) : (
                claims.map(claim => (
                    <div
                        key={claim._id}
                        style={{
                            ...s.card,
                            boxShadow: selected?._id === claim._id ? '0 0 0 2px #2563eb' : undefined,
                            borderColor: selected?._id === claim._id ? '#2563eb' : '#e2e8f0'
                        }}
                        onClick={() => setSelected(selected?._id === claim._id ? null : claim)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                            {/* Left */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                                    <p style={{ fontWeight: 700, color: '#1e293b', margin: 0, fontSize: 15 }}>
                                        Claim #{claim._id.slice(-8).toUpperCase()}
                                    </p>
                                    <span style={s.typeBadge(claim.claimType || 'cashless')}>
                                        {claim.claimType === 'reimbursement' ? '💵 Reimbursement' : '🏥 Cashless'}
                                    </span>
                                </div>
                                <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 4px' }}>
                                    {new Date(claim.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    {claim.doctorId?.fullName ? ` · Dr. ${claim.doctorId.fullName}` : ''}
                                </p>
                                {claim.clinicalInfo?.diagnosis && (
                                    <p style={{ color: '#475569', fontSize: 13, margin: '2px 0 0' }}>
                                        Dx: <strong>{claim.clinicalInfo.diagnosis}</strong>
                                    </p>
                                )}
                                {(claim.insuranceProvider || claim.policyNumber) && (
                                    <p style={{ color: '#64748b', fontSize: 12, margin: '3px 0 0' }}>
                                        🏢 {claim.insuranceProvider || '—'}{claim.policyNumber ? ` · Policy: ${claim.policyNumber}` : ''}
                                    </p>
                                )}
                            </div>
                            {/* Right */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                <span style={s.badge(claim.status)}>
                                    {STATUS_META[claim.status]?.icon} {claim.status.replace('_', ' ').toUpperCase()}
                                </span>
                                {claim.claimAmount && (
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>₹{claim.claimAmount.toLocaleString()}</span>
                                )}
                                {claim.approvedAmount && (
                                    <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>✅ Paid: ₹{claim.approvedAmount.toLocaleString()}</span>
                                )}
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    <button
                                        onClick={(e) => downloadPdf(
                                            () => insuranceAPI.downloadMedicalFilePDF(claim.prescriptionId?._id || claim.prescriptionId),
                                            `medical-file-${claim.patientId?.fullName?.replace(/\s/g, '-') || 'patient'}.pdf`,
                                            e
                                        )}
                                        disabled={!!downloadingId}
                                        style={{ padding: '6px 10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 11 }}
                                    >
                                        {downloadingId === `medical-file-${claim.patientId?.fullName?.replace(/\s/g, '-') || 'patient'}.pdf` ? '⏳' : '📋 Medical PDF'}
                                    </button>
                                    <button
                                        onClick={(e) => downloadPdf(
                                            () => insuranceAPI.downloadInsuranceClaimPDF(claim._id),
                                            `insurance-claim-${claim._id.slice(-8)}.pdf`,
                                            e
                                        )}
                                        disabled={!!downloadingId}
                                        style={{ padding: '6px 10px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 11 }}
                                    >
                                        {downloadingId === `insurance-claim-${claim._id.slice(-8)}.pdf` ? '⏳' : '📑 Insurance PDF'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Status timeline */}
                        {selected?._id === claim._id && (
                            <div style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                                {/* Timeline bar */}
                                <div style={{ display: 'flex', gap: 0, marginBottom: 16, fontSize: 11, fontWeight: 700 }}>
                                    {timeline.map((st, i) => {
                                        const m = STATUS_META[st];
                                        const active = claim.status === st;
                                        const past = timeline.indexOf(claim.status) > i;
                                        return (
                                            <div key={st} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                                                    background: active ? m.color : past ? '#22c55e' : '#e2e8f0',
                                                    color: active || past ? '#fff' : '#94a3b8',
                                                    border: `2px solid ${active ? m.color : past ? '#22c55e' : '#d1d5db'}`
                                                }}>
                                                    {past ? '✓' : m.icon}
                                                </div>
                                                <span style={{ color: active ? m.color : past ? '#15803d' : '#94a3b8', textAlign: 'center', fontSize: 10 }}>
                                                    {st.replace('_', ' ')}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* ICD Codes */}
                                {claim.icdCodes?.length > 0 && (
                                    <div style={{ marginBottom: 10 }}>
                                        <p style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', margin: '0 0 6px' }}>📋 ICD-10 Codes:</p>
                                        {claim.icdCodes.map((c, i) => (
                                            <span key={i} style={s.chip()}>{c.code} — {c.description}</span>
                                        ))}
                                    </div>
                                )}

                                {/* CPT Codes */}
                                {claim.cptCodes?.length > 0 && (
                                    <div style={{ marginBottom: 10 }}>
                                        <p style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', margin: '0 0 6px' }}>⚕️ CPT Codes:</p>
                                        {claim.cptCodes.map((c, i) => (
                                            <span key={i} style={s.chip('#f0fdf4', '#86efac', '#15803d')}>{c.code} — {c.description}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Narrative */}
                                {claim.claimNarrative && (
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', margin: '0 0 6px' }}>📄 Claim Narrative:</p>
                                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, background: '#f8fafc', padding: '12px', borderRadius: 8, border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>
                                            {claim.claimNarrative}
                                        </p>
                                    </div>
                                )}

                                {/* Rejection reason */}
                                {claim.status === 'rejected' && claim.rejectionReason && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginTop: 10 }}>
                                        <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}><strong>Rejection Reason:</strong> {claim.rejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default PatientClaims;
