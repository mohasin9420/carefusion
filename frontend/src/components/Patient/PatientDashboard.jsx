import { Routes, Route } from 'react-router-dom';
import Navbar from '../Shared/Navbar';
import Sidebar from '../Shared/Sidebar';
import './PatientDashboard.css';
import { useState, useEffect, useRef } from 'react';

import { useAuth } from '../../context/AuthContext';
import { patientAPI, appointmentAPI, feedbackAPI, insuranceAPI } from '../../services/api';
import { getProfileImageUrl } from '../../utils/imageUtils';
import BookAppointment from './BookAppointment';
import MyAppointments from './MyAppointments';
import FamilyMembers from './FamilyMembers';
import '../Laboratory/LaboratoryDashboard.css';


const PatientDashboard = () => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Backend returns: { id, email, role, profile: { _id, ...patientData } }
    const patientId = user?.profile?._id || user?.id;

    const sidebarLinks = [
        { to: '/patient', label: '🏠 Dashboard', exact: true },
        { to: '/patient/book', label: '📅 Book Appointment' },
        { to: '/patient/appointments', label: '🗓️ My Appointments' },
        { to: '/patient/family', label: '👨‍👩‍👧‍👦 Family Members' },
        { to: '/patient/prescriptions', label: '💊 Prescriptions' },
        { to: '/patient/lab-reports', label: '🧪 Lab Reports' },
        { to: '/patient/insurance', label: '🛡️ Insurance Claims' },
        { to: '/patient/profile', label: '👤 My Profile' },
    ];

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="dashboard-wrapper">
            <Navbar onToggleSidebar={toggleSidebar} />
            <div className="dashboard-layout">
                <Sidebar 
                    links={sidebarLinks} 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)} 
                />
                <main className="dashboard-main">
                    <Routes>
                        <Route index element={<PatientHome patientId={patientId} />} />
                        <Route path="book" element={<BookAppointment patientId={patientId} />} />
                        <Route path="appointments" element={<MyAppointments patientId={patientId} />} />
                        <Route path="family" element={<FamilyMembers />} />
                        <Route path="prescriptions" element={<Prescriptions />} />
                        <Route path="lab-reports" element={<LabReports />} />
                        <Route path="insurance" element={<Insurance patientId={patientId} />} />
                        <Route path="profile" element={<Profile patientId={patientId} />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const PatientHome = ({ patientId }) => {
    const [stats, setStats] = useState({ appointments: 0, upcoming: 0, prescriptions: 0, labReports: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [appointments, prescriptions, labReports] = await Promise.all([
                    patientId ? appointmentAPI.getMyAppointments(patientId) : Promise.resolve({ data: [] }),
                    patientAPI.getPrescriptions(),
                    patientAPI.getLabReports(),
                ]);

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const upcoming = appointments.data.filter(apt =>
                    new Date(apt.appointmentDate) >= today && apt.status === 'scheduled'
                ).length;

                setStats({
                    appointments: appointments.data.length,
                    upcoming,
                    prescriptions: prescriptions.data.length,
                    labReports: labReports.data.length,
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [patientId]);

    if (loading) return <div className="spinner"></div>;

    return (
        <div>
            <h1 className="mb-lg">Patient Dashboard</h1>
            <div className="grid grid-3">
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Total Appointments</h3>
                    <p className="text-4xl font-bold">{stats.appointments}</p>
                </div>
                <div className="card" style={{ backgroundColor: '#dbeafe', borderColor: '#3b82f6' }}>
                    <h3 className="text-gray-600 mb-sm">Upcoming</h3>
                    <p className="text-4xl font-bold">{stats.upcoming}</p>
                </div>
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Prescriptions</h3>
                    <p className="text-4xl font-bold">{stats.prescriptions}</p>
                </div>
                <div className="card">
                    <h3 className="text-gray-600 mb-sm">Lab Reports</h3>
                    <p className="text-4xl font-bold">{stats.labReports}</p>
                </div>
            </div>
        </div>
    );
};

const Prescriptions = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        patientAPI.getPrescriptions()
            .then(res => setPrescriptions(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleDownloadPDF = async (id) => {
        try {
            const res = await patientAPI.downloadPrescriptionPDF(id);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Prescription-${id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(err.response?.data?.message || 'Download failed');
        }
    };

    const filteredPrescriptions = prescriptions.filter(rx => 
        rx.doctorId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rx.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rx.prescriptionId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="prescriptions-page">
            <div className="prescription-header">
                <div>
                    <h1 className="mb-xs">Medical Prescriptions</h1>
                    <p className="text-muted">View and manage your digital health records</p>
                </div>
                <div className="prescription-search">
                    <span className="prescription-search-icon">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search doctor or diagnosis..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filteredPrescriptions.length === 0 ? (
                <div className="card text-center p-xl">
                    <p className="text-gray-500">No prescriptions match your search.</p>
                </div>
            ) : (
                <div className="prescriptions-list">
                    {filteredPrescriptions.map((rx) => (
                        <div key={rx._id} className="rx-card">
                            <div className={`rx-status-strip ${rx.status}`}></div>
                            <div className="rx-body">
                                <div className="rx-header">
                                    <div className="rx-doctor-info">
                                        <div className="rx-doctor-avatar">
                                            {rx.doctorId?.fullName?.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <h3 className="rx-doctor-name">Dr. {rx.doctorId?.fullName}</h3>
                                            <p className="rx-specialization">{rx.doctorId?.specialization}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="rx-id-badge">#{rx.prescriptionId || rx._id.slice(-8).toUpperCase()}</span>
                                        <div className={`rx-for-badge ${rx.bookedForMember?.memberId ? 'rx-for-member' : 'rx-for-self'}`}>
                                            {rx.bookedForMember?.memberId ? `👩‍👩‍👦 ${rx.bookedForMember.memberName}` : '👤 Myself'}
                                        </div>
                                    </div>
                                </div>

                                <div className="rx-diagnosis-box">
                                    <span className="rx-diagnosis-label">Clinical Diagnosis</span>
                                    <p className="rx-diagnosis">{rx.diagnosis}</p>
                                </div>

                                <div className="table-responsive">
                                    <table className="rx-med-table">
                                        <thead>
                                            <tr>
                                                <th>Medicine Name</th>
                                                <th>Dosage</th>
                                                <th>Frequency</th>
                                                <th>Duration</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rx.medicines?.map((med, idx) => (
                                                <tr key={idx}>
                                                    <td className="rx-med-name">💊 {med.name}</td>
                                                    <td>{med.dosage}</td>
                                                    <td>{med.frequency}</td>
                                                    <td>{med.duration}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="rx-footer">
                                    <div className="rx-date">
                                        🗓️ Prescribed on {new Date(rx.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                    <div className="rx-actions">
                                        <button 
                                            onClick={() => handleDownloadPDF(rx._id)} 
                                            className="btn btn-primary"
                                            style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none' }}
                                        >
                                            📄 Download PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


/* ─────────────────────────────────────────────────────────────
   Raise Issue Modal (Patient Side)
───────────────────────────────────────────────────────────── */
const RaiseIssueModal = ({ report, onClose, onSuccess }) => {
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (message.trim().length < 5) {
            setError('Please describe the issue in detail (min 5 characters).');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await patientAPI.raiseLabDispute(report._id, message.trim());
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to raise issue. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="lab-modal-overlay" onClick={onClose}>
            <div className="lab-modal lab-modal-sm" onClick={e => e.stopPropagation()}>
                <div className="lab-modal-header" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}>
                    <h2>🚩 Raise an Issue</h2>
                    <button className="lab-modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit} className="lab-modal-body">
                    <div className="lab-info-group" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="lab-info-item">
                            <label className="lab-info-label">Test</label>
                            <div className="lab-info-value">{report.testName}</div>
                        </div>
                    </div>
                    <div className="lab-form-group">
                        <label className="lab-form-label">Describe the Issue <span className="required">*</span></label>
                        <textarea
                            className="lab-form-input lab-form-textarea"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="e.g. The uploaded report belongs to a different patient. Please correct it."
                            rows={4}
                            autoFocus
                        />
                        <small className="lab-form-hint">{message.length}/500 characters</small>
                    </div>
                    {error && <div className="lab-modal-error">{error}</div>}
                    <div className="lab-modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
                        <button type="submit" className="btn btn-danger-solid" disabled={submitting}>
                            {submitting ? 'Submitting...' : '🚩 Send Issue to Lab'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LabReports = () => {
    const [labReports, setLabReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [issueModal, setIssueModal] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    const fetchReports = () => {
        patientAPI.getLabReports()
            .then(res => setLabReports(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchReports(); }, []);

    const handleIssueSuccess = () => {
        setSuccessMsg('✅ Your issue has been sent to the laboratory. They will review and fix it.');
        fetchReports();
        setTimeout(() => setSuccessMsg(''), 5000);
    };

    const filteredReports = labReports.filter(report => {
        const matchesSearch = report.testName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status) => {
        if (status === 'completed' || status === 'delivered') return 'lab-status-completed';
        if (status === 'in-progress') return 'lab-status-in-progress';
        return 'lab-status-pending';
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="lab-reports-page">
            <div className="lab-reports-header">
                <div>
                    <h1 className="mb-xs">Laboratory Reports</h1>
                    <p className="text-muted">Digital results from your diagnostic tests</p>
                </div>
                <div className="flex gap-4">
                    <div className="lab-search-box relative" style={{ width: '250px' }}>
                        <span className="lab-search-icon absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200"
                            placeholder="Search tests..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="rounded-xl border border-slate-200 px-4 py-2 bg-white font-semibold text-slate-600"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                    </select>
                </div>
            </div>

            {successMsg && (
                <div className="alert alert-success mb-md flex items-center gap-2">
                    {successMsg}
                </div>
            )}

            {filteredReports.length === 0 ? (
                <div className="card text-center p-xl">
                    <p className="text-gray-500">No matching laboratory reports found.</p>
                </div>
            ) : (
                <div className="lab-ledger-card">
                    <div className="table-responsive">
                        <table className="lab-ledger-table">
                            <thead>
                                <tr>
                                    <th>Test Name & Category</th>
                                    <th>Patient</th>
                                    <th>Ordering Doctor</th>
                                    <th>Registered Date</th>
                                    <th>Status</th>
                                    <th>View Result</th>
                                    <th>Issues</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.map((report) => {
                                    const dispute = report.reportDispute;
                                    const hasOpenDispute = dispute?.status === 'open';
                                    const hasResolvedDispute = dispute?.status === 'resolved';

                                    return (
                                        <tr key={report._id} className={`lab-ledger-row ${hasOpenDispute ? 'is-disputed' : ''}`}>
                                            <td>
                                                <div className="lab-test-info">
                                                    <span className="lab-test-name">{report.testName}</span>
                                                    <span className="lab-test-category">{report.testCategory || 'General Diagnostic'}</span>
                                                </div>
                                            </td>
                                            <td className="font-semibold" style={{ color: report.bookedForMember?.memberId ? '#7c3aed' : '#0f172a' }}>
                                                {report.bookedForMember?.memberId ? `👩‍👩‍👦 ${report.bookedForMember.memberName}` : '👤 Myself'}
                                            </td>
                                            <td>Dr. {report.doctorId?.fullName || '—'}</td>
                                            <td className="text-slate-500">{new Date(report.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`lab-status-badge ${getStatusStyle(report.status)}`}>
                                                    {report.status?.replace(/-/g, ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                {report.reportPDF ? (
                                                    <a
                                                        href={`http://localhost:5000/${(report.reportPDF || '').replace(/\\/g, '/')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="lab-view-btn"
                                                    >
                                                        📄 View Results
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-slate-400">Processing...</span>
                                                )}
                                            </td>
                                            <td>
                                                {hasOpenDispute ? (
                                                    <div className="lab-dispute-indicator">
                                                        🚩 Issue Raised
                                                    </div>
                                                ) : hasResolvedDispute ? (
                                                    <span className="lab-resolved-badge" title={`Resolved: ${dispute.resolutionNote || ''}`}>
                                                        ✅ Resolved
                                                    </span>
                                                ) : report.status === 'completed' && report.reportPDF ? (
                                                    <button
                                                        className="lab-dispute-btn"
                                                        onClick={() => setIssueModal(report)}
                                                    >
                                                        🚩 Report Issue
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Raise Issue Modal */}
            {issueModal && (
                <RaiseIssueModal
                    report={issueModal}
                    onClose={() => setIssueModal(null)}
                    onSuccess={handleIssueSuccess}
                />
            )}
        </div>
    );
};



const Profile = ({ patientId }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        patientAPI.getProfile()
            .then(res => { setProfile(res.data); setFormData(res.data); })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        try {
            const res = await patientAPI.updateProfile(formData);
            setProfile(res.data);
            setEditing(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        }
    };

    if (loading) return <div className="spinner"></div>;
    if (!profile) return <div className="card text-center p-xl">Profile not found</div>;

    return (
        <div className="profile-page">
            <div className="prescription-header mb-xl">
                <div>
                    <h1 className="mb-xs">My Health Profile</h1>
                    <p className="text-muted">Manage your personal and medical information</p>
                </div>
            </div>

            <div className="profile-dashboard">
                <div className="profile-sidebar">
                    <div className="profile-avatar-card">
                        <div className="profile-avatar-large" style={profile.profilePhoto ? { padding: 0, overflow: 'hidden', background: 'transparent' } : {}}>
                            {getProfileImageUrl(profile.profilePhoto) ? (
                                <img
                                    src={getProfileImageUrl(profile.profilePhoto)}
                                    alt={profile.fullName}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', borderRadius: '50%', display: 'block' }}
                                />
                            ) : (
                                profile.fullName?.split(' ').map(n => n[0]).join('')
                            )}
                        </div>
                        <h2 className="mb-xs">{profile.fullName}</h2>
                        <p className="text-sm text-slate-500 mb-lg">Patient ID: {patientId.slice(-8).toUpperCase()}</p>
                        
                        {!editing && (
                            <button onClick={() => setEditing(true)} className="btn btn-primary w-full">
                                ✏️ Edit Profile
                            </button>
                        )}
                    </div>

                    <div className="card p-lg" style={{ borderRadius: '20px' }}>
                        <h4 className="mb-md text-slate-400 text-xs font-bold uppercase">Quick Stats</h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Blood Group</span>
                                <span className="font-bold text-rose-500">{profile.bloodGroup || '—'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Gender</span>
                                <span className="font-bold">{profile.gender || '—'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Age</span>
                                <span className="font-bold">{profile.age || '—'} yrs</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-content-card">
                    <div className="profile-section-title">
                        <span>Personal Information</span>
                        {editing && <span className="text-xs text-blue-500">Editing Mode</span>}
                    </div>

                    {!editing ? (
                        <div className="profile-data-grid">
                            <div className="profile-field">
                                <span className="profile-label">Full Name</span>
                                <span className="profile-value">{profile.fullName}</span>
                            </div>
                            <div className="profile-field">
                                <span className="profile-label">Email Address</span>
                                <span className="profile-value">{profile.email || '—'}</span>
                            </div>
                            <div className="profile-field">
                                <span className="profile-label">Mobile Number</span>
                                <span className="profile-value">{profile.mobile || '—'}</span>
                            </div>
                            <div className="profile-field">
                                <span className="profile-label">Gender</span>
                                <span className="profile-value">{profile.gender || '—'}</span>
                            </div>
                            <div className="profile-field">
                                <span className="profile-label">Age</span>
                                <span className="profile-value">{profile.age || '—'} years</span>
                            </div>
                            <div className="profile-field">
                                <span className="profile-label">Blood Group</span>
                                <span className="profile-value">{profile.bloodGroup || '—'}</span>
                            </div>
                            <div className="profile-field" style={{ gridColumn: 'span 2' }}>
                                <span className="profile-label">Residential Address</span>
                                <span className="profile-value">{profile.address || '—'}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="profile-form">
                            <div className="grid grid-2 gap-x-8 gap-y-4">
                                <div className="form-group">
                                    <label className="profile-label mb-xs block">Full Name</label>
                                    <input className="input" value={formData.fullName || ''} onChange={(e) => setFormData(f => ({ ...f, fullName: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="profile-label mb-xs block">Mobile Number</label>
                                    <input className="input" value={formData.mobile || ''} onChange={(e) => setFormData(f => ({ ...f, mobile: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="profile-label mb-xs block">Age</label>
                                    <input type="number" className="input" value={formData.age || ''} onChange={(e) => setFormData(f => ({ ...f, age: parseInt(e.target.value) || undefined }))} />
                                </div>
                                <div className="form-group">
                                    <label className="profile-label mb-xs block">Gender</label>
                                    <select className="input" value={formData.gender || ''} onChange={(e) => setFormData(f => ({ ...f, gender: e.target.value }))}>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="profile-label mb-xs block">Blood Group</label>
                                    <select className="input" value={formData.bloodGroup || ''} onChange={(e) => setFormData(f => ({ ...f, bloodGroup: e.target.value }))}>
                                        <option value="">Select Blood Group</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="profile-label mb-xs block">Residential Address</label>
                                    <textarea className="input" value={formData.address || ''} onChange={(e) => setFormData(f => ({ ...f, address: e.target.value }))} rows={3} />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-xl pt-lg border-t border-slate-100">
                                <button onClick={handleSave} className="btn btn-primary px-xl">Save Changes</button>
                                <button onClick={() => { setEditing(false); setFormData(profile); }} className="btn btn-secondary px-xl">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const Insurance = ({ patientId }) => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!patientId) return;
        insuranceAPI.getPatientClaims(patientId)
            .then(res => setClaims(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [patientId]);

    const handleDownloadPDF = async (id, ref) => {
        try {
            const res = await insuranceAPI.downloadInsuranceClaimPDF(id);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Insurance-Claim-${ref || id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(err.response?.data?.message || 'Download failed');
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="insurance-page">
            <div className="prescription-header mb-xl">
                <div>
                    <h1 className="mb-xs">Insurance Claims</h1>
                    <p className="text-muted">Official insurance documentation and cashless claim records</p>
                </div>
            </div>

            {claims.length === 0 ? (
                <div className="card text-center p-xl" style={{ borderRadius: '24px' }}>
                    <div className="text-4xl mb-md">🛡️</div>
                    <h3 className="mb-sm">No Insurance records</h3>
                    <p className="text-gray-500">Wait for the hospital to process and share your insurance claims here.</p>
                </div>
            ) : (
                <div className="insurance-grid">
                    {claims.map((claim) => (
                        <div key={claim._id} className="claim-card">
                            <div className="claim-header">
                                <div>
                                    <h3 className="provider-name">{claim.insuranceProvider || 'Insurance Provider'}</h3>
                                    <p className="claim-ref">REF: {claim.claimReference || claim._id.toString().slice(-8).toUpperCase()}</p>
                                </div>
                                <span className={`lab-status-badge ${claim.status === 'approved' || claim.status === 'paid' ? 'lab-status-completed' : claim.status === 'rejected' ? 'btn-danger' : 'lab-status-in-progress'}`}>
                                    {claim.status?.toUpperCase()}
                                </span>
                            </div>

                            <div className="claim-info-grid">
                                <div className="claim-info-item">
                                    <span className="claim-info-label">Policy Type</span>
                                    <span className="claim-info-value">{claim.claimType === 'cashless' ? 'Cashless Facility' : 'Reimbursement'}</span>
                                </div>
                                <div className="claim-info-item">
                                    <span className="claim-info-label">Ordering Doctor</span>
                                    <span className="claim-info-value">Dr. {claim.doctorId?.fullName || 'Hospital Staff'}</span>
                                </div>
                                <div className="claim-info-item">
                                    <span className="claim-info-label">Diagnosis</span>
                                    <span className="claim-info-value">{claim.clinicalInfo?.diagnosis || 'General Treatment'}</span>
                                </div>
                                <div className="claim-info-item">
                                    <span className="claim-info-label">Service Date</span>
                                    <span className="claim-info-value">{new Date(claim.appointmentId?.appointmentDate || claim.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleDownloadPDF(claim._id, claim.claimReference)} 
                                className="lab-view-btn w-full py-4 justify-center"
                                style={{ gap: '10px' }}
                            >
                                📄 Download Digital Insurance Copy
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;
