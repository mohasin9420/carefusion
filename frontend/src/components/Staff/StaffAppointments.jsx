import { useState, useEffect } from 'react';
import { appointmentAPI, availabilityAPI, staffAPI, adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import EmergencyShiftModal from './EmergencyShiftModal';
import PatientProfileSummary from '../Shared/PatientProfileSummary';
import '../Doctor/DoctorSchedule.css';

/* ─────────────────────────────────────────────────────────────────
   Tab constants
───────────────────────────────────────────────────────────────── */
const TAB_PENDING = 'pending';
const TAB_PAYMENTS = 'payments';
const TAB_ALL = 'all';
const TAB_BOOK = 'book';

const API_BASE_URL = 'http://localhost:5000'; // Adjust based on your environment

/* ═══════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════ */
const StaffAppointments = ({ initialTab }) => {
    const [activeTab, setActiveTab] = useState(initialTab || TAB_PENDING);
    const [pendingCount, setPendingCount] = useState(0);

    const refreshPendingCount = async () => {
        try {
            const res = await appointmentAPI.getPendingReviews();
            setPendingCount(res.data.length);
        } catch (_) { }
    };

    useEffect(() => { refreshPendingCount(); }, []);

    return (
        <div className="staff-appointments-premium">
            {/* Modern Tab Bar */}
            <div className="flex gap-md border-b mb-xl overflow-x-auto pb-sm">
                <button 
                    className={`btn btn-sm ${activeTab === TAB_PENDING ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setActiveTab(TAB_PENDING)}
                    style={{ borderRadius: '20px', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    🕐 Pending Review
                    {pendingCount > 0 && (
                        <span className="m-badge m-badge-red" style={{ padding: '2px 8px' }}>{pendingCount}</span>
                    )}
                </button>
                <button 
                    className={`btn btn-sm ${activeTab === TAB_PAYMENTS ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setActiveTab(TAB_PAYMENTS)}
                    style={{ borderRadius: '20px', padding: '8px 20px' }}
                >
                    💰 Payment & Fees
                </button>
                <button 
                    className={`btn btn-sm ${activeTab === TAB_ALL ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setActiveTab(TAB_ALL)}
                    style={{ borderRadius: '20px', padding: '8px 20px' }}
                >
                    📋 All Appointments
                </button>
                <button 
                    className={`btn btn-sm ${activeTab === TAB_BOOK ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setActiveTab(TAB_BOOK)}
                    style={{ borderRadius: '20px', padding: '8px 20px' }}
                >
                    ➕ Book for Patient
                </button>
            </div>

            {activeTab === TAB_PENDING && (
                <PendingReviewTab onCountChange={setPendingCount} />
            )}
            {activeTab === TAB_PAYMENTS && (
                <PaymentsTab />
            )}
            {activeTab === TAB_ALL && (
                <AllAppointmentsTab onRefreshPending={refreshPendingCount} />
            )}
            {activeTab === TAB_BOOK && (
                <BookForPatientTab onBooked={() => { refreshPendingCount(); setActiveTab(TAB_ALL); }} />
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Tab 1 — Pending Review
═══════════════════════════════════════════════════════════════ */
const PendingReviewTab = ({ onCountChange }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState(null);
    const [formData, setFormData] = useState({});   // { [id]: { initialDiagnosis, staffNotes } }
    const [message, setMessage] = useState({ type: '', text: '' });

    const [showProfileSummary, setShowProfileSummary] = useState(false);
    const [profileSummary, setProfileSummary] = useState(null);
    const [loadingSummaryId, setLoadingSummaryId] = useState(null);

    const [verifyingPaymentId, setVerifyingPaymentId] = useState(null);

    const handleFetchSummary = async (patientId, memberId) => {
        setLoadingSummaryId(patientId);
        try {
            const res = await staffAPI.getPatientClinicalSummary(patientId, memberId || 'null');
            setProfileSummary(res.data);
            setShowProfileSummary(true);
        } catch (err) {
            console.error(err);
            alert('Failed to fetch profile summary');
        } finally {
            setLoadingSummaryId(null);
        }
    };

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await appointmentAPI.getPendingReviews();
            setAppointments(res.data);
            onCountChange(res.data.length);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load pending appointments' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const getForm = (id) => formData[id] || { initialDiagnosis: '', staffNotes: '', symptoms: '', severity: '', diseaseType: '' };

    const setField = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            [id]: { ...getForm(id), [field]: value }
        }));
    };

    const handleReview = async (id, decision) => {
        setReviewingId(id);
        setMessage({ type: '', text: '' });
        try {
            const { initialDiagnosis, staffNotes, symptoms, severity, diseaseType } = getForm(id);
            await appointmentAPI.reviewAppointment(id, { decision, initialDiagnosis, staffNotes, symptoms, severity, diseaseType });
            setMessage({ type: 'success', text: `Appointment ${decision} successfully!` });
            await fetchPending();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Review failed' });
        } finally {
            setReviewingId(null);
        }
    };

    const handleVerifyPayment = async (id, status) => {
        setVerifyingPaymentId(id);
        try {
            await appointmentAPI.verifyPayment(id, { status });
            setMessage({ type: 'success', text: `Payment ${status}!` });
            await fetchPending();
        } catch (err) {
            setMessage({ type: 'error', text: 'Payment verification failed' });
        } finally {
            setVerifyingPaymentId(null);
        }
    };

    if (loading) return <div className="spinner" />;

    return (
        <div>
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1 className="m-0">Queue Backlog</h1>
                    <p className="text-gray-500 font-medium">Screen new patient requests and verify financial proof.</p>
                </div>
                <div className="m-badge m-badge-yellow p-md">{appointments.length} Awaiting Review</div>
            </div>

            {message.text && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '1rem' }}>
                    {message.text}
                </div>
            )}

            {appointments.length === 0 ? (
                <div className="empty-state card p-xl text-center">
                    <div className="text-4xl mb-md">🎉</div>
                    <h3>Board is Clean!</h3>
                    <p className="text-gray-500">No appointments currently require manual staff intervention.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-lg">
                    {appointments.map((apt) => (
                        <div key={apt._id} className="card p-0 overflow-hidden border-2" style={{ borderColor: apt.paymentDetails?.transactionId ? '#dcfce7' : '#fef9c3' }}>
                            <div className="grid grid-2 gap-0" style={{ gridTemplateColumns: '1fr 340px' }}>
                                {/* Left Side: Clinical Check */}
                                <div className="p-xl">
                                    <div className="flex justify-between items-start mb-lg">
                                        <div>
                                            <h3 className="m-0 text-xl">{apt.patientId?.fullName || 'Unknown Patient'}</h3>
                                            <div className="text-gray-500 text-sm font-medium">Record ID: {apt.patientId?._id?.slice(-8)}</div>
                                        </div>
                                        <span className="m-badge m-badge-yellow">Awaiting Staff Signoff</span>
                                    </div>
                                    
                                    <div className="grid grid-2 gap-md mb-xl p-md bg-gray-50 rounded-xl">
                                        <div className="flex flex-col">
                                            <span className="profile-label text-xs">Consulting Doctor</span>
                                            <span className="font-bold">👨‍⚕️ Dr. {apt.doctorId?.fullName}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="profile-label text-xs">Schedule Date</span>
                                            <span className="font-bold">📅 {new Date(apt.appointmentDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="profile-label text-xs">Assigned Slot</span>
                                            <span className="font-bold">⏰ {apt.slotStartTime} – {apt.slotEndTime}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="profile-label text-xs">Category</span>
                                            <span className="m-badge m-badge-blue mt-1" style={{ alignSelf: 'flex-start' }}>{apt.visitType}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-md mb-xl">
                                        <button 
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => handleFetchSummary(apt.patientId._id, apt.bookedForMember?.memberId)}
                                            disabled={loadingSummaryId === apt.patientId._id}
                                        >
                                            {loadingSummaryId === apt.patientId._id ? '⏳ Loading...' : '🤖 View AI History Summary'}
                                        </button>
                                    </div>

                                    <div className="space-y-md">
                                        <div className="form-group mb-md">
                                            <label className="profile-label">Reported Symptoms</label>
                                            <input 
                                                className="input" 
                                                placeholder="e.g. Fever for 3 days, chest pain..." 
                                                value={getForm(apt._id).symptoms} 
                                                onChange={e => setField(apt._id, 'symptoms', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="profile-label">Primary Triage Note / Initial Observation</label>
                                            <textarea 
                                                className="input" 
                                                placeholder="Describe the patient's general condition..." 
                                                rows={2}
                                                value={getForm(apt._id).initialDiagnosis}
                                                onChange={e => setField(apt._id, 'initialDiagnosis', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-md pt-md">
                                            <button className="btn btn-primary" style={{ background: '#10b981', flex: 2 }} onClick={() => handleReview(apt._id, 'approved')} disabled={reviewingId === apt._id}>
                                                ✅ Approve & Tokenize
                                            </button>
                                            <button className="btn btn-outline-danger" style={{ flex: 1 }} onClick={() => handleReview(apt._id, 'rejected')} disabled={reviewingId === apt._id}>
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Financial Check */}
                                <div className="p-xl bg-orange-50 border-l" style={{ background: '#fffbeb' }}>
                                    <h4 className="flex items-center gap-2 mb-xl mt-0">
                                        <span className="text-xl">💳</span> Financial Proof
                                    </h4>
                                    
                                    <div className="mb-lg">
                                        <label className="profile-label text-xs text-orange-800">UTR / Reference ID</label>
                                        <div className="p-md bg-white border border-orange-200 rounded-lg font-mono text-center text-lg font-bold text-gray-800">
                                            {apt.paymentDetails?.transactionId || 'NOT PROVIDED'}
                                        </div>
                                    </div>

                                    <div className="mb-xl">
                                        <label className="profile-label text-xs text-orange-800">Payment Screenshot</label>
                                        {apt.paymentDetails?.screenshot ? (
                                            <div className="mt-2 rounded-xl overflow-hidden border-2 border-orange-200 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => window.open(`${API_BASE_URL}/${apt.paymentDetails.screenshot}`, '_blank')}>
                                                <img 
                                                    src={`${API_BASE_URL}/${apt.paymentDetails.screenshot}`} 
                                                    alt="Payment Screenshot" 
                                                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                                                />
                                                <div className="p-xs bg-orange-100 text-center text-xs font-bold text-orange-700">CLICK TO EXPAND</div>
                                            </div>
                                        ) : (
                                            <div className="mt-2 p-lg text-center bg-white border-2 border-dashed border-orange-200 rounded-xl">
                                                <div className="text-3xl mb-xs">❌</div>
                                                <div className="text-sm font-bold text-orange-800 uppercase">Missing Evidence</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-md">
                                        <button 
                                            className={`btn btn-sm w-full font-bold ${apt.paymentDetails?.paymentStatus === 'verified' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => handleVerifyPayment(apt._id, 'verified')}
                                            disabled={verifyingPaymentId === apt._id || apt.paymentDetails?.paymentStatus === 'verified'}
                                            style={{ height: '45px', background: apt.paymentDetails?.paymentStatus === 'verified' ? '#10b981' : undefined }}
                                        >
                                            {verifyingPaymentId === apt._id ? '⏳ Processing...' : (apt.paymentDetails?.paymentStatus === 'verified' ? '✓ VERIFIED' : 'CONFIRM PAYMENT')}
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-link text-red-600 w-full font-bold" 
                                            onClick={() => handleVerifyPayment(apt._id, 'rejected')}
                                            disabled={verifyingPaymentId === apt._id}
                                        >
                                            Reject Payment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* AI Profile Summary Modal */}
            {showProfileSummary && (
                <PatientProfileSummary
                    summaryData={profileSummary}
                    onClose={() => setShowProfileSummary(false)}
                />
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Tab 2 — Payments Tab (History + Fee Management)
═══════════════════════════════════════════════════════════════ */
const PaymentsTab = () => {
    const { user } = useAuth();
    const [subTab, setSubTab] = useState('history'); // history, fees
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); 
    
    // Fee management state
    const [editingFee, setEditingFee] = useState({}); // { [id]: { fee, upi } }
    const [updatingDoctorId, setUpdatingDoctorId] = useState(null);
    const [message, setMessage] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            if (subTab === 'history') {
                const res = await appointmentAPI.getAllAppointments({});
                const withPayment = res.data.filter(a => a.paymentDetails?.transactionId || a.paymentDetails?.screenshot);
                setAppointments(withPayment);
            } else {
                // Determine API based on role
                const res = user.role === 'admin' 
                    ? await adminAPI.getUsersByRole('doctor') 
                    : await staffAPI.getDoctors();
                
                setDoctors(res.data);
                const editState = {};
                res.data.forEach(d => {
                    // Handle potential differences in data structure between admin and staff APIs
                    const profile = d.profile || d;
                    editState[d._id] = { 
                        fee: profile.consultationFee || 500, 
                        upi: profile.upiId || '' 
                    };
                });
                setEditingFee(editState);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [subTab]);

    const handleUpdateFee = async (id) => {
        setUpdatingDoctorId(id);
        setMessage('');
        try {
            const { fee, upi } = editingFee[id];
            const data = { consultationFee: Number(fee), upiId: upi };
            
            // Switch API based on role
            if (user.role === 'admin') {
                await adminAPI.updateDoctorFee(id, data);
            } else {
                await staffAPI.updateDoctorFee(id, data);
            }
            
            setMessage('Doctor fee updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to update fee');
        } finally {
            setUpdatingDoctorId(null);
        }
    };

    const filtered = appointments.filter(a => {
        if (filter === 'all') return true;
        return a.paymentDetails?.paymentStatus === filter;
    });

    return (
        <div className="payments-management-view">
            <div className="flex justify-between items-center mb-xl">
                <div className="flex gap-md bg-gray-100 p-xs rounded-xl">
                    <button 
                        className={`btn btn-sm ${subTab === 'history' ? 'btn-primary' : 'btn-link text-gray-500'}`} 
                        onClick={() => setSubTab('history')}
                        style={{ borderRadius: '10px' }}
                    >
                        📋 Master Ledger
                    </button>
                    <button 
                        className={`btn btn-sm ${subTab === 'fees' ? 'btn-primary' : 'btn-link text-gray-500'}`} 
                        onClick={() => setSubTab('fees')}
                        style={{ borderRadius: '10px' }}
                    >
                        💰 Consultation Setup
                    </button>
                </div>
                {subTab === 'history' && (
                    <div className="flex items-center gap-md">
                        <span className="text-sm font-medium text-gray-400">STATUS FILTER:</span>
                        <select className="input" style={{ width: 'auto', minWidth: '180px' }} value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="all">Complete History</option>
                            <option value="pending">Needs Verification</option>
                            <option value="verified">Verified Receipts</option>
                            <option value="rejected">Flagged / Rejected</option>
                        </select>
                    </div>
                )}
            </div>

            {message && (
                <div className={`m-badge ${message.includes('success') ? 'm-badge-green' : 'm-badge-red'} mb-lg p-md w-full`} style={{ borderRadius: '12px' }}>
                    {message.includes('success') ? '✅' : '⚠️'} {message}
                </div>
            )}

            {subTab === 'history' ? (
                <div className="medical-ledger-container">
                    <div className="medical-ledger-header">
                        <h3>Financial Audit Log</h3>
                        <div className="m-badge m-badge-blue">Total Entries: {filtered.length}</div>
                    </div>
                    <table className="medical-ledger-table">
                        <thead>
                            <tr>
                                <th>Patient Participant</th>
                                <th>Transaction Blueprint</th>
                                <th>Assigned Doctor</th>
                                <th>Settlement</th>
                                <th>Audit Status</th>
                                <th className="text-center">Evidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-xl text-gray-400">No matching financial records found.</td></tr>
                            ) : (
                                filtered.map(apt => (
                                    <tr key={apt._id}>
                                        <td>
                                            <div className="font-bold">{apt.patientId?.fullName}</div>
                                            <div className="text-xs text-gray-400">{apt.patientId?.mobile}</div>
                                        </td>
                                        <td>
                                            <div className="text-indigo-600 font-mono text-sm font-bold bg-indigo-50 px-2 py-1 rounded-md inline-block">
                                                {apt.paymentDetails?.transactionId || 'WALK-IN / CASH'}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">Ref ID: {apt._id.slice(-8).toUpperCase()}</div>
                                        </td>
                                        <td>
                                            <div className="font-medium">Dr. {apt.doctorId?.fullName}</div>
                                            <div className="text-xs text-gray-400">{new Date(apt.appointmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                        </td>
                                        <td>
                                            <div className="text-lg font-extrabold text-gray-900">₹{apt.consultationCharge}</div>
                                            <div className="text-xs text-gray-400 font-mono uppercase">{apt.visitType} FEE</div>
                                        </td>
                                        <td>
                                            <span className={`m-badge ${
                                                apt.paymentDetails?.paymentStatus === 'verified' ? 'm-badge-green' : 
                                                apt.paymentDetails?.paymentStatus === 'rejected' ? 'm-badge-red' : 'm-badge-yellow'
                                            }`}>
                                                {apt.paymentDetails?.paymentStatus || 'pending'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            {apt.paymentDetails?.screenshot ? (
                                                <button 
                                                    className="btn btn-sm btn-outline-primary" 
                                                    onClick={() => window.open(`${API_BASE_URL}/${apt.paymentDetails.screenshot}`, '_blank')}
                                                >
                                                    View Receipt
                                                </button>
                                            ) : <span className="text-gray-300 italic text-sm">No Proof</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-3 gap-lg">
                    {doctors.map(d => {
                        const profile = d.profile || d;
                        return (
                            <div key={d._id} className="card p-xl border-none shadow-sm hover:shadow-md transition-all" style={{ background: '#ffffff', borderRadius: '20px' }}>
                                <div className="flex items-center gap-md mb-lg">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl">👨‍⚕️</div>
                                    <div>
                                        <h3 className="m-0 text-lg">Dr. {profile.fullName || d.email}</h3>
                                        <div className="text-sm text-indigo-600 font-bold">{profile.specialization}</div>
                                    </div>
                                </div>
                                
                                <div className="space-y-lg">
                                    <div className="form-group">
                                        <label className="profile-label text-xs">Standard Consultation Fee</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                                            <input 
                                                type="number" 
                                                className="input pl-8" 
                                                style={{ fontSize: '1.25rem', fontWeight: 800 }}
                                                value={editingFee[d._id]?.fee || ''}
                                                onChange={e => setEditingFee({ ...editingFee, [d._id]: { ...editingFee[d._id], fee: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="profile-label text-xs">Merchant UPI Identifier</label>
                                        <input 
                                            type="text" 
                                            className="input" 
                                            style={{ fontFamily: 'monospace', color: '#2563eb' }}
                                            value={editingFee[d._id]?.upi || ''}
                                            onChange={e => setEditingFee({ ...editingFee, [d._id]: { ...editingFee[d._id], upi: e.target.value } })}
                                            placeholder="doctor-id@okicici"
                                        />
                                    </div>
                                    <button 
                                        className="btn btn-primary w-full shadow-lg" 
                                        onClick={() => handleUpdateFee(d._id)}
                                        disabled={updatingDoctorId === d._id}
                                    >
                                        {updatingDoctorId === d._id ? '⚡ Synchronizing...' : 'Save Configuration'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Tab 3 — All Appointments
═══════════════════════════════════════════════════════════════ */
const AllAppointmentsTab = ({ onRefreshPending }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const [filterDoctor, setFilterDoctor] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [rescheduleTarget, setRescheduleTarget] = useState(null);

    useEffect(() => { if (selectedDate) fetchAppointments(); }, [selectedDate]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await appointmentAPI.getAllAppointments({ date: selectedDate });
            setAppointments(response.data);
        } catch (err) {
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (appointmentId, newStatus) => {
        setUpdatingId(appointmentId);
        setError('');
        try {
            await appointmentAPI.updateAppointmentStatus(appointmentId, newStatus);
            setSuccess(`Status updated to ${newStatus}`);
            fetchAppointments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleStaffReschedule = async (appointmentId, newDate, newSlotStartTime, newSlotEndTime, postponeCharge) => {
        setError('');
        try {
            await appointmentAPI.rescheduleAppointment(appointmentId, {
                newDate, newSlotStartTime, newSlotEndTime, postponeCharge,
                rescheduleNote: 'Rescheduled by staff'
            });
            setSuccess('Appointment rescheduled successfully');
            fetchAppointments();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reschedule appointment');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            scheduled: 'badge-primary',
            'in-progress': 'badge-warning',
            completed: 'badge-success',
            'no-show': 'badge-danger'
        };
        return badges[status] || 'badge-secondary';
    };

    const getApprovalBadge = (s, severity) => {
        if (s === 'pending_review') return <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>⏳ Pending</span>;
        if (s === 'rejected') return <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>❌ Rejected</span>;
        
        if (severity === 'Severe') return <span className="badge" style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>🔥 Severe</span>;
        if (severity === 'Moderate') return <span className="badge" style={{ fontSize: '0.72rem', background: '#ffedd5', color: '#ea580c', border: '1px solid #fed7aa' }}>⚠️ Moderate</span>;
        if (severity === 'Mild') return <span className="badge" style={{ fontSize: '0.72rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>✅ Mild</span>;
        
        return null;
    };

    const getFilteredAppointments = () => appointments.filter(apt => {
        const doctorMatch = filterDoctor === 'all' || apt.doctorId?._id === filterDoctor;
        const statusMatch = filterStatus === 'all' || apt.status === filterStatus;
        return doctorMatch && statusMatch;
    });

    const filteredAppointments = getFilteredAppointments();
    const doctors = [...new Map(appointments.map(a => [a.doctorId?._id, a.doctorId])).values()].filter(Boolean);

    const stats = (() => {
        const f = filteredAppointments;
        return {
            total: f.length,
            pending: f.filter(a => a.staffApprovalStatus === 'pending_review').length,
            scheduled: f.filter(a => a.status === 'scheduled' && a.staffApprovalStatus !== 'pending_review').length,
            inProgress: f.filter(a => a.status === 'in-progress').length,
            completed: f.filter(a => a.status === 'completed').length,
            noShow: f.filter(a => a.status === 'no-show').length,
            walkIns: f.filter(a => a.bookingType === 'walkin').length,
        };
    })();

    return (
        <div className="all-appointments-view">
            <div className="flex justify-between items-end mb-xl">
                <div>
                    <h1 className="m-0">Master Appointment Ledger</h1>
                    <p className="text-gray-500 font-medium">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex gap-md items-center">
                    <button onClick={() => setShowEmergencyModal(true)} className="btn btn-danger font-bold shadow-lg" style={{ borderRadius: '12px' }}>🚨 Emergency Override</button>
                    <div className="date-selector">
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input" style={{ width: 'auto' }} />
                    </div>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="grid grid-2 gap-lg mb-xl">
                <div className="form-group mb-0">
                    <label className="profile-label">Filter by Clinical Professional</label>
                    <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} className="input">
                        <option value="all">All Available Doctors</option>
                        {doctors.map(doctor => (
                            <option key={doctor._id} value={doctor._id}>Dr. {doctor.fullName} ({doctor.specialization})</option>
                        ))}
                    </select>
                </div>
                <div className="form-group mb-0">
                    <label className="profile-label">Lifecycle Status</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input">
                        <option value="all">Any Status</option>
                        <option value="scheduled">Scheduled Only</option>
                        <option value="in-progress">Actively Ongoing</option>
                        <option value="completed">Consultation Finished</option>
                        <option value="no-show">No Show / Cancelled</option>
                    </select>
                </div>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {/* Statistics Dashboard */}
            <div className="modern-stat-grid mb-xl">
                <div className="modern-stat-card">
                    <div className="stat-icon-wrapper">📊</div>
                    <div className="stat-info">
                        <h3>Daily Total</h3>
                        <div className="stat-value">{stats.total}</div>
                    </div>
                </div>
                <div className="modern-stat-card">
                    <div className="stat-icon-wrapper" style={{ background: '#fef9c3', color: '#854d0e' }}>⏳</div>
                    <div className="stat-info">
                        <h3>Pending Approval</h3>
                        <div className="stat-value">{stats.pending}</div>
                    </div>
                </div>
                <div className="modern-stat-card">
                    <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#10b981' }}>✅</div>
                    <div className="stat-info">
                        <h3>Completed</h3>
                        <div className="stat-value">{stats.completed}</div>
                    </div>
                </div>
                <div className="modern-stat-card">
                    <div className="stat-icon-wrapper" style={{ background: '#f1f5f9', color: '#475569' }}>🚶</div>
                    <div className="stat-info">
                        <h3>Walk-ins</h3>
                        <div className="stat-value">{stats.walkIns}</div>
                    </div>
                </div>
            </div>

            {loading ? <div className="spinner" /> : filteredAppointments.length > 0 ? (
                <div className="medical-ledger-container">
                    <div className="medical-ledger-header">
                        <h3>Live Timeline Ledger</h3>
                        <div className="flex gap-2">
                             <span className="m-badge m-badge-blue">{stats.scheduled} Scheduled</span>
                             <span className="m-badge m-badge-yellow">{stats.inProgress} Active</span>
                        </div>
                    </div>
                    <div className="appointments-timeline-modern p-xl">
                        {filteredAppointments.map((appointment) => (
                            <div key={appointment._id} className={`timeline-item-premium ${appointment.status}`}>
                                <div className="timeline-time-col">
                                    <div className="time-badge">{appointment.slotStartTime}</div>
                                    <div className="text-xs text-gray-400">Duration: 15m</div>
                                </div>
                                <div className="timeline-card-content card">
                                    <div className="flex justify-between items-start mb-md">
                                        <div>
                                            <h3 className="m-0 text-indigo-600">{appointment.patientId?.fullName || 'Anonymous Patient'}</h3>
                                            <div className="text-sm text-gray-500 font-medium">Dr. {appointment.doctorId?.fullName}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className={`m-badge ${appointment.bookingType === 'walkin' ? 'm-badge-purple' : 'm-badge-blue'}`}>
                                                {appointment.bookingType === 'walkin' ? `Token #${appointment.tokenNumber}` : 'Digital'}
                                            </span>
                                            <span className={`m-badge ${
                                                appointment.status === 'scheduled' ? 'm-badge-blue' :
                                                appointment.status === 'in-progress' ? 'm-badge-yellow' :
                                                appointment.status === 'completed' ? 'm-badge-green' : 'm-badge-red'
                                            }`}>
                                                {appointment.status.replace('-', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="patient-quick-stats grid grid-3 gap-md mb-md">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 uppercase font-bold">Contact</span>
                                            <span className="text-sm font-semibold">{appointment.patientId?.mobile || 'No Phone'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 uppercase font-bold">Billing</span>
                                            <span className="text-sm font-extrabold">₹{appointment.consultationCharge}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 uppercase font-bold">Evidence</span>
                                            <span className={`m-badge ${appointment.paymentDetails?.paymentStatus === 'verified' ? 'm-badge-green' : 'm-badge-yellow'}`} style={{ fontSize: '0.65rem', alignSelf: 'flex-start' }}>
                                                {appointment.paymentDetails?.paymentStatus || 'None'}
                                            </span>
                                        </div>
                                    </div>

                                    {appointment.initialDiagnosis && (
                                        <div className="p-md bg-green-50 rounded-lg mb-md text-sm border-l-4 border-green-500">
                                            <strong className="text-green-800">Triage Note:</strong> {appointment.initialDiagnosis}
                                        </div>
                                    )}

                                    {/* Action Footprint */}
                                    <div className="flex gap-2 pt-md border-t">
                                        {appointment.status === 'scheduled' && (
                                            <button onClick={() => setRescheduleTarget(appointment)} className="btn btn-sm btn-outline-warning">Reschedule</button>
                                        )}
                                        {appointment.status === 'scheduled' && (
                                            <button onClick={() => handleStatusUpdate(appointment._id, 'in-progress')} className="btn btn-sm btn-primary">Start Examination</button>
                                        )}
                                        {appointment.status === 'in-progress' && (
                                            <button onClick={() => handleStatusUpdate(appointment._id, 'completed')} className="btn btn-sm btn-success">Mark Completed</button>
                                        )}
                                        <button onClick={() => handleStatusUpdate(appointment._id, 'no-show')} className="btn btn-sm btn-link text-red-600">Flag No-Show</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>No Appointments</h3>
                    <p>No appointments scheduled for this date.</p>
                </div>
            )}

            {showEmergencyModal && (
                <EmergencyShiftModal
                    selectedDate={selectedDate}
                    doctors={doctors}
                    onClose={() => setShowEmergencyModal(false)}
                    onSuccess={(message) => {
                        setShowEmergencyModal(false);
                        setSuccess(`🚨 ${message}`);
                        fetchAppointments();
                        setTimeout(() => setSuccess(''), 7000);
                    }}
                />
            )}

            {rescheduleTarget && (() => {
                const newDate = prompt(`New date for ${rescheduleTarget.patientId?.fullName}'s appointment (YYYY-MM-DD):`, selectedDate);
                if (!newDate) { setRescheduleTarget(null); return null; }
                const charge = Number(prompt('Postponement charge (₹):', '100') || 100);
                handleStaffReschedule(rescheduleTarget._id, newDate, rescheduleTarget.slotStartTime, rescheduleTarget.slotEndTime, charge);
                setRescheduleTarget(null);
                return null;
            })()}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Tab 4 — Book for Patient (Walk-in counter)
═══════════════════════════════════════════════════════════════ */
const BookForPatientTab = ({ onBooked }) => {
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [slots, setSlots] = useState([]);
    const [form, setForm] = useState({
        patientId: '', doctorId: '', appointmentDate: new Date().toISOString().split('T')[0],
        slotStartTime: '', slotEndTime: '', consultationCharge: '', visitType: 'OPD',
        bookingType: 'walkin', notes: '', symptoms: '', severity: '', diseaseType: '', initialDiagnosis: ''
    });
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        Promise.all([staffAPI.getPatients(), staffAPI.getDoctors()])
            .then(([pr, dr]) => { setPatients(pr.data); setDoctors(dr.data); })
            .catch(err => setError('Failed to load patients/doctors'));
    }, []);

    useEffect(() => {
        if (form.doctorId && form.appointmentDate) {
            fetchSlots();
        } else {
            setSlots([]);
        }
    }, [form.doctorId, form.appointmentDate]);

    const fetchSlots = async () => {
        setLoadingSlots(true);
        setForm(f => ({ ...f, slotStartTime: '', slotEndTime: '' }));
        try {
            const res = await availabilityAPI.getAvailableSlots(form.doctorId, form.appointmentDate);
            setSlots(res.data);
        } catch (err) {
            setSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const handleSlotSelect = (slot) => {
        setForm(f => ({ ...f, slotStartTime: slot.startTime, slotEndTime: slot.endTime }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.slotStartTime || !form.slotEndTime) {
            setError('Please select a time slot');
            return;
        }
        setSubmitting(true);
        setError('');
        setSuccess('');
        try {
            await appointmentAPI.staffBookAppointment({
                ...form,
                consultationCharge: Number(form.consultationCharge)
            });
            setSuccess('✅ Appointment booked successfully!');
            setTimeout(() => { onBooked(); }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card p-xl" style={{ maxWidth: '800px', margin: '0' }}>
            <div className="flex items-center gap-md mb-xl">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl">➕</div>
                <div>
                    <h2 className="m-0">Counter Registration</h2>
                    <p className="text-gray-500 m-0">Create manual walk-in entries or phone bookings.</p>
                </div>
            </div>

            {error && <div className="m-badge m-badge-red mb-lg p-md w-full">{error}</div>}
            {success && <div className="m-badge m-badge-green mb-lg p-md w-full">{success}</div>}
            
            <form onSubmit={handleSubmit} className="grid grid-2 gap-xl">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="profile-label">Search/Select Patient</label>
                    <select className="input" required value={form.patientId} onChange={e => setField('patientId', e.target.value)}>
                        <option value="">-- Choose Existing Patient --</option>
                        {patients.map(p => <option key={p._id} value={p._id}>{p.fullName} ({p.mobile})</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label className="profile-label">Assigned Consultant</label>
                    <select className="input" required value={form.doctorId} onChange={e => setField('doctorId', e.target.value)}>
                        <option value="">-- Choose Doctor --</option>
                        {doctors.map(d => <option key={d._id} value={d._id}>{d.fullName} ({d.specialization})</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label className="profile-label">Consultation Date</label>
                    <input className="input" type="date" required value={form.appointmentDate} onChange={e => setField('appointmentDate', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <div className="flex justify-between items-center mb-md">
                        <label className="profile-label m-0">Live Consultation Map</label>
                        <div className="flex gap-md">
                            <div className="flex items-center gap-1">
                                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#ecfdf5', border: '1px solid #10b981' }}></span>
                                <span className="text-[10px] font-bold text-gray-400">AVAILABLE</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#f1f5f9', border: '1px solid #cbd5e1' }}></span>
                                <span className="text-[10px] font-bold text-gray-400">BOOKED</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', 
                        gap: '8px', 
                        padding: '16px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px'
                    }}>
                        {loadingSlots ? (
                            <div className="col-span-full py-lg text-center text-gray-400 text-sm">Synchronizing clinical availability...</div>
                        ) : slots.length === 0 ? (
                            <div className="col-span-full py-lg text-center text-gray-400 text-sm italic">No schedule configured for this date.</div>
                        ) : slots.map(s => {
                            const isSelected = form.slotStartTime === s.startTime;
                            const isFull = !s.isAvailable;
                            
                            return (
                                <button
                                    type="button"
                                    key={s.startTime}
                                    disabled={isFull}
                                    onClick={() => handleSlotSelect(s)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '10px 4px',
                                        borderRadius: '12px',
                                        border: '2px solid',
                                        cursor: isFull ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        background: isSelected ? '#2563eb' : isFull ? '#f1f5f9' : '#fff',
                                        borderColor: isSelected ? '#1d4ed8' : isFull ? '#e2e8f0' : '#10b981',
                                        color: isSelected ? '#fff' : isFull ? '#94a3b8' : '#047857'
                                    }}
                                >
                                    <span style={{ fontSize: '12px', fontWeight: 800 }}>{s.startTime}</span>
                                    <span style={{ 
                                        fontSize: '9px', 
                                        fontWeight: 700, 
                                        marginTop: '4px',
                                        opacity: isSelected ? 0.8 : 0.6,
                                        background: isSelected ? 'rgba(255,255,255,0.2)' : isFull ? '#e2e8f0' : '#dcfce7',
                                        padding: '1px 6px',
                                        borderRadius: '4px'
                                    }}>
                                        {isFull ? 'FULL' : `${s.bookedCount}/${s.maxCapacity}`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="form-group">
                    <label className="profile-label">Charge (₹)</label>
                    <input className="input" type="number" required value={form.consultationCharge} onChange={e => setField('consultationCharge', e.target.value)} />
                </div>

                <div className="form-group">
                    <label className="profile-label">Visit Type</label>
                    <select className="input" value={form.visitType} onChange={e => setField('visitType', e.target.value)}>
                        <option value="OPD">OPD</option>
                        <option value="Online">Online</option>
                    </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <button type="submit" className="btn btn-primary w-full h-12 mt-lg shadow-lg" disabled={submitting} style={{ borderRadius: '12px' }}>
                        {submitting ? 'Authenticating...' : 'CONFIRM & BOOK APPOINTMENT'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StaffAppointments;
