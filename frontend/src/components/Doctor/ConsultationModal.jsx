import { useState } from 'react';
import PrescriptionForm from './PrescriptionForm';
import DiagnosticTestForm from './DiagnosticTestForm';
import PatientHistoryModal from './PatientHistoryModal';
import InsuranceClaimAssistant from './InsuranceClaimAssistant';
import PatientProfileSummary from '../Shared/PatientProfileSummary';
import { doctorAPI } from '../../services/api';
import './ConsultationModal.css';

const ConsultationModal = ({ appointment, onClose, onPrescriptionSubmit }) => {
    const [activeTab, setActiveTab] = useState('prescription');
    const [selectedTests, setSelectedTests] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [issuedPrescription, setIssuedPrescription] = useState(null);
    const [showProfileSummary, setShowProfileSummary] = useState(false);
    const [profileSummary, setProfileSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    if (!appointment) return null;

    const patient = appointment.patientId || {};
    const member = appointment.bookedForMember?.memberId ? appointment.bookedForMember : null;
    const consultName = member ? member.memberName : (patient.fullName || 'Unknown Patient');
    const consultSubtitle = member
        ? `${member.relation} • via ${patient.fullName || 'Account'}`
        : null;
    const patientInitial = consultName.charAt(0).toUpperCase();

    // When doctor issues a prescription, store it and optionally switch to insurance tab
    const handlePrescriptionSubmit = async (prescriptionData) => {
        const result = await onPrescriptionSubmit(prescriptionData);
        // If the parent returns the created prescription, cache it
        if (result?.prescription) {
            setIssuedPrescription(result.prescription);
        }
        return result;
    };

    const handleFetchSummary = async () => {
        if (profileSummary) {
            setShowProfileSummary(true);
            return;
        }
        setLoadingSummary(true);
        try {
            const memberId = appointment.bookedForMember?.memberId || 'null';
            const res = await doctorAPI.getPatientClinicalSummary(patient._id, memberId);
            setProfileSummary(res.data);
            setShowProfileSummary(true);
        } catch (err) {
            console.error(err);
            alert('Failed to fetch profile summary');
        } finally {
            setLoadingSummary(false);
        }
    };

    return (
        <div className="consultation-modal-overlay">
            <div className="consultation-modal-content">
                {/* Header with Patient Brief */}
                <div className="modal-header">
                    <div className="patient-brief">
                        <div className="avatar-placeholder">{patientInitial}</div>
                        <div className="patient-info-text">
                            <h2 style={{ color: member ? '#7c3aed' : undefined }}>
                                {consultName}
                                {member && (
                                    <span style={{ fontSize: '0.75rem', background: '#ede9fe', color: '#7c3aed', marginLeft: '0.5rem', padding: '0.1rem 0.5rem', borderRadius: '12px', fontWeight: 500, verticalAlign: 'middle' }}>
                                        {member.relation}
                                    </span>
                                )}
                            </h2>
                            <div className="patient-meta">
                                {consultSubtitle && (
                                    <span className="meta-item" style={{ color: '#64748b' }}>👤 {consultSubtitle}</span>
                                )}
                                <span className="meta-item">🆔 #{appointment._id.slice(-6).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>

                        <button
                            className={`btn btn-sm ${loadingSummary ? 'btn-secondary' : 'btn-success'}`}
                            onClick={handleFetchSummary}
                            disabled={loadingSummary}
                            style={{ 
                                background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                                border: 'none',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            {loadingSummary ? '⏳ Loading...' : '🤖 Profile Summary'}
                        </button>
                        <button
                            className="btn btn-sm btn-info"
                            onClick={() => setShowHistory(true)}
                            title="View Patient History"
                        >
                            📋 History
                        </button>
                        <button className="close-modal-btn" onClick={onClose} title="Close">×</button>
                    </div>
                </div>

                {/* Modern Tabs */}
                <div className="modal-tabs">
                    <button
                        className={`modal-tab ${activeTab === 'prescription' ? 'active' : ''}`}
                        onClick={() => setActiveTab('prescription')}
                    >
                        🩺 Create Prescription
                    </button>
                    <button
                        className={`modal-tab ${activeTab === 'lab' ? 'active' : ''}`}
                        onClick={() => setActiveTab('lab')}
                    >
                        🧪 Request Lab Test
                    </button>

                </div>

                {/* Modal Body */}
                <div className="modal-body">
                    {activeTab === 'prescription' ? (
                        <PrescriptionForm
                            appointment={appointment}
                            onSubmit={handlePrescriptionSubmit}
                            onCancel={onClose}
                            initialLabTests={selectedTests}
                            onLabTestsChange={setSelectedTests}
                        />
                    ) : activeTab === 'lab' ? (
                        <div className="lab-test-tab-container">
                            <DiagnosticTestForm
                                selectedTests={selectedTests}
                                onAddTest={(test) => setSelectedTests([...selectedTests, test])}
                                onRemoveTest={(index) => setSelectedTests(selectedTests.filter((_, i) => i !== index))}
                            />
                            <div className="form-footer">
                                <button className="btn-premium btn-solid" onClick={() => {
                                    setActiveTab('prescription');
                                }}>
                                    ✅ Added {selectedTests.length} tests to Prescription
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Insurance Claim Tab */
                        <div style={{ padding: '4px 0' }}>
                            {!issuedPrescription && !appointment.prescriptionId ? (
                                <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '20px 24px', textAlign: 'center' }}>
                                    <p style={{ fontSize: 32, margin: '0 0 8px' }}>⚕️</p>
                                    <p style={{ fontWeight: 700, color: '#92400e', margin: '0 0 6px' }}>Issue Prescription First</p>
                                    <p style={{ color: '#78350f', fontSize: 14, margin: 0 }}>
                                        Please complete the prescription in the "🩺 Create Prescription" tab, then come back here to generate the insurance claim.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('prescription')}
                                        style={{ marginTop: 16, padding: '8px 20px', background: '#d97706', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
                                    >
                                        Go to Prescription →
                                    </button>
                                </div>
                            ) : (
                                <InsuranceClaimAssistant
                                    appointment={appointment}
                                    prescription={issuedPrescription || appointment.prescription}
                                    patient={patient}
                                    showInsuranceFields={true}
                                    defaultClaimType="cashless"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Patient History Modal */}
                {showHistory && (
                    <PatientHistoryModal
                        patientId={patient._id}
                        bookedForMember={member}
                        onClose={() => setShowHistory(false)}
                    />
                )}

                {/* AI Profile Summary Modal */}
                {showProfileSummary && (
                    <PatientProfileSummary
                        summaryData={profileSummary}
                        onClose={() => setShowProfileSummary(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default ConsultationModal;
