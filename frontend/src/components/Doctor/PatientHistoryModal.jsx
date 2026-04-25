import { useState, useEffect } from 'react';
import { doctorAPI } from '../../services/api';
import './PatientHistoryModal.css';

const PatientHistoryModal = ({ patientId, bookedForMember, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                // Pass memberId so backend filters to just this person's records.
                // bookedForMember=null  → main account (memberId param = 'null')
                // bookedForMember set  → specific family member
                const memberId = bookedForMember !== undefined
                    ? (bookedForMember?.memberId ?? null)
                    : undefined; // undefined = no filter, return all
                const response = await doctorAPI.getPatientEMR(patientId, memberId);
                setHistory(response.data);
            } catch (err) {
                console.error('Failed to fetch patient history:', err);
                setError('Failed to load patient history');
            } finally {
                setLoading(false);
            }
        };

        if (patientId) {
            fetchHistory();
        }
    }, [patientId, bookedForMember]);

    if (!patientId) return null;

    return (
        <div className="history-modal-overlay" onClick={onClose}>
            <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="history-modal-header">
                    <div>
                        <h2>📋 Medical History</h2>
                        {bookedForMember?.memberId ? (
                            <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem' }}>
                                <span style={{ color: '#7c3aed', fontWeight: 700 }}>
                                    {bookedForMember.memberName}
                                </span>
                                <span style={{ color: '#94a3b8', marginLeft: '0.35rem' }}>
                                    ({bookedForMember.relation}) — via {history?.patient?.fullName || 'account'}
                                </span>
                            </p>
                        ) : (
                            <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                                {history?.patient?.fullName || ''}
                            </p>
                        )}
                    </div>
                    <button className="close-btn" onClick={onClose} title="Close">×</button>
                </div>

                <div className="history-modal-body">
                    {loading ? (
                        <div className="spinner" style={{ margin: '2rem auto' }}></div>
                    ) : error ? (
                        <div className="alert alert-error">{error}</div>
                    ) : history ? (
                        <>
                            {/* Patient / Member Info */}
                            {bookedForMember?.memberId ? (
                                <div className="patient-info-card" style={{ borderLeft: '4px solid #7c3aed' }}>
                                    <h3 style={{ color: '#7c3aed' }}>{bookedForMember.memberName}</h3>
                                    <div className="patient-meta">
                                        <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.8rem' }}>
                                            {bookedForMember.relation}
                                        </span>
                                        {history.memberInfo?.age && <span>🎂 {history.memberInfo.age} yrs</span>}
                                        {history.memberInfo?.gender && <span>⚥ {history.memberInfo.gender}</span>}
                                        {history.memberInfo?.bloodGroup && <span>🩸 {history.memberInfo.bloodGroup}</span>}
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        Account: {history.patient?.fullName} • 📞 {history.patient?.mobile || 'N/A'}
                                    </p>
                                </div>
                            ) : (
                                <div className="patient-info-card">
                                    <h3>{history.patient?.fullName || 'Unknown Patient'}</h3>
                                    <div className="patient-meta">
                                        <span>🎂 {history.patient?.age || 'N/A'} years</span>
                                        <span>⚥ {history.patient?.gender || 'Unknown'}</span>
                                        <span>🆔 {history.patient?.patientId || 'N/A'}</span>
                                    </div>
                                </div>
                            )}

                            {/* Previous Prescriptions */}
                            <div className="history-section">
                                <h3>💊 Previous Prescriptions</h3>
                                {history.prescriptions && history.prescriptions.length > 0 ? (
                                    <div className="prescription-list">
                                        {history.prescriptions.map((rx, idx) => (
                                            <div key={rx._id || idx} className="prescription-card">
                                                <div className="prescription-header">
                                                    <div>
                                                        <h4>{rx.diagnosis}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            Dr. {rx.doctorId?.fullName} • {new Date(rx.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <span className="prescription-id">#{rx.prescriptionId || rx._id.slice(-6)}</span>
                                                </div>
                                                <div className="prescription-details">
                                                    <strong>Medicines:</strong>
                                                    <ul>
                                                        {rx.medicines?.map((med, midx) => (
                                                            <li key={midx}>
                                                                <span className="med-name">{med.name}</span> -
                                                                {med.dosage}, {med.frequency} for {med.duration}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {rx.notes && (
                                                        <div className="prescription-notes">
                                                            <strong>Notes:</strong> {rx.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No previous prescriptions found</p>
                                )}
                            </div>

                            {/* Lab Tests */}
                            <div className="history-section">
                                <h3>🧪 Lab Test History</h3>
                                {history.labTests && history.labTests.length > 0 ? (
                                    <div className="lab-test-list">
                                        {history.labTests.map((test, idx) => (
                                            <div key={test._id || idx} className="lab-test-card">
                                                <div className="lab-test-header">
                                                    <h4>{test.testName}</h4>
                                                    <span className={`badge badge-${test.status === 'completed' ? 'success' :
                                                        test.status === 'in-progress' ? 'info' : 'warning'
                                                        }`}>
                                                        {test.status?.replace(/-/g, ' ')}
                                                    </span>
                                                </div>
                                                <div className="lab-test-details">
                                                    <p className="text-sm text-gray-500">
                                                        Requested: {new Date(test.createdAt).toLocaleDateString()}
                                                    </p>
                                                    {test.status === 'completed' && test.testingCompletedAt && (
                                                        <p className="text-sm text-success">
                                                            Completed: {new Date(test.testingCompletedAt).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                    {test.results && test.results.length > 0 && (
                                                        <div className="test-results">
                                                            <strong>Results:</strong>
                                                            <table className="results-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Parameter</th>
                                                                        <th>Value</th>
                                                                        <th>Reference</th>
                                                                        <th>Status</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {test.results.map((result, ridx) => (
                                                                        <tr key={ridx} className={result.isAbnormal ? 'abnormal' : ''}>
                                                                            <td>{result.parameter}</td>
                                                                            <td>{result.value} {result.unit}</td>
                                                                            <td>{result.referenceRange?.normalRange || '-'}</td>
                                                                            <td>
                                                                                <span className={`flag flag-${result.flag}`}>
                                                                                    {result.flag}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                    {test.reportPDF && (
                                                        <a
                                                            href={`http://localhost:5000/${test.reportPDF.replace(/\\/g, '/')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-info"
                                                            style={{ marginTop: '0.5rem' }}
                                                        >
                                                            📄 View Full Report
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No lab tests found</p>
                                )}
                            </div>

                            {/* Recent Appointments */}
                            <div className="history-section">
                                <h3>📅 Recent Appointments</h3>
                                {history.appointments && history.appointments.length > 0 ? (
                                    <div className="appointment-list">
                                        {history.appointments.map((appt, idx) => (
                                            <div key={appt._id || idx} className="appointment-card-mini">
                                                <div>
                                                    <strong>Dr. {appt.doctorId?.fullName}</strong>
                                                    <span className="text-gray-500"> - {appt.doctorId?.specialization}</span>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(appt.appointmentDate).toLocaleDateString()} • {appt.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No recent appointments</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500">No medical history available</p>
                    )}
                </div>

                <div className="history-modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default PatientHistoryModal;
