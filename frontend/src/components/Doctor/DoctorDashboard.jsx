import { Routes, Route, Link, useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../Shared/Navbar';
import Sidebar from '../Shared/Sidebar';
import '../Patient/PatientDashboard.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorAPI, appointmentAPI, availabilityAPI, insuranceAPI } from '../../services/api';
import { getProfileImageUrl } from '../../utils/imageUtils';
import DoctorSchedule from './DoctorSchedule';
import DoctorAvailabilityManage from './DoctorAvailabilityManage';
import InsuranceClaimAssistant from './InsuranceClaimAssistant';
import MedicineAutocomplete from './MedicineAutocomplete';
import DiagnosticTestAutocomplete from './DiagnosticTestAutocomplete';

const DoctorDashboard = () => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const doctorId = user?.profile?._id || user?.id;

    const sidebarLinks = [
        { to: '/doctor', label: 'Dashboard' },
        { to: '/doctor/schedule', label: 'My Schedule' },
        { to: '/doctor/availability', label: 'Manage Availability' },
        { to: '/doctor/prescriptions', label: 'Create Prescription' },
        { to: '/doctor/lab-requests', label: 'Request Lab Test' },
        { to: '/doctor/insurance-claims', label: '🏥 Insurance Claims' },
    ];

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="dashboard-doctor">
            <Navbar onToggleSidebar={toggleSidebar} />
            <div className="dashboard-layout">
                <Sidebar 
                    links={sidebarLinks} 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)} 
                />
                <main className="dashboard-main">
                    <Routes>
                        <Route index element={<DoctorHome doctorId={doctorId} user={user} />} />
                        <Route path="schedule" element={<DoctorSchedule doctorId={doctorId} />} />
                        <Route path="availability" element={<DoctorAvailabilityManage />} />
                        <Route path="prescriptions" element={<CreatePrescription doctorId={doctorId} />} />
                        <Route path="lab-requests" element={<LabRequests doctorId={doctorId} />} />
                        <Route path="patient/:id" element={<PatientEMR />} />
                        <Route path="insurance-claims" element={<InsuranceClaimPage doctorId={doctorId} />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const DoctorHome = ({ doctorId, user }) => {
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            if (!doctorId) {
                setLoading(false);
                return;
            }
            try {
                const today = new Date().toISOString().split('T')[0];
                const [todayRes, upcomingRes] = await Promise.all([
                    doctorAPI.getAppointments(today),
                    doctorAPI.getUpcomingAppointments(7)
                ]);
                setTodayAppointments(todayRes.data || []);
                setUpcomingAppointments(upcomingRes.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [doctorId]);

    if (loading) return <div className="spinner"></div>;

    const todayStats = {
        total: todayAppointments.length,
        scheduled: todayAppointments.filter(a => a.status === 'scheduled').length,
        inProgress: todayAppointments.filter(a => a.status === 'in-progress').length,
        completed: todayAppointments.filter(a => a.status === 'completed').length,
    };
    const upcomingOnly = upcomingAppointments.filter(a => {
        const d = new Date(a.appointmentDate).toISOString().split('T')[0];
        return d !== new Date().toISOString().split('T')[0];
    });

    const getStatusBadge = (status) => {
        const map = { scheduled: 'info', 'in-progress': 'warning', completed: 'success', reschedule_required: 'danger', cancelled: 'secondary', 'no-show': 'secondary' };
        return `badge-${map[status] || 'secondary'}`;
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-xl animate-fade">
                <div>
                    <h1 className="m-0 text-4xl">Doctor Dashboard</h1>
                    <p className="text-slate-500 font-medium">Precision Medicine & Patient Care Protocol</p>
                </div>
                <div className="flex items-center gap-md">
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--primary-light)', background: 'var(--primary-light)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
                        {getProfileImageUrl(user?.profile?.profilePicture) ? (
                            <img src={getProfileImageUrl(user?.profile?.profilePicture)} alt={user?.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                        ) : (
                            user?.fullName?.charAt(0) || 'D'
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Authenticated Practitioner</div>
                        <div className="text-primary font-black text-xl">Dr. {user?.profile?.fullName?.split(' ').slice(-1)[0] || user?.fullName?.split(' ')[1] || 'Doctor'}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-3 mb-xl">
                <div className="modern-stat-card glass-surface" style={{ '--role-accent': 'var(--primary)', '--role-light': 'var(--primary-light)' }}>
                    <div className="stat-icon-wrapper">📅</div>
                    <div className="stat-info">
                        <h3>Today's Load</h3>
                        <div className="stat-value">{todayStats.total}</div>
                    </div>
                </div>
                <div className="modern-stat-card glass-surface" style={{ '--role-accent': 'var(--warning)', '--role-light': '#fffbeb' }}>
                    <div className="stat-icon-wrapper">⏳</div>
                    <div className="stat-info">
                        <h3>In Waiting</h3>
                        <div className="stat-value">{todayStats.scheduled}</div>
                    </div>
                </div>
                <div className="modern-stat-card glass-surface" style={{ '--role-accent': 'var(--success)', '--role-light': '#ecfdf5' }}>
                    <div className="stat-icon-wrapper">✅</div>
                    <div className="stat-info">
                        <h3>Processed</h3>
                        <div className="stat-value">{todayStats.completed}</div>
                    </div>
                </div>
            </div>

            {todayAppointments.length > 0 && (
                <div className="medical-ledger-container">
                    <div className="medical-ledger-header">
                        <h3>Daily Appointment Schedule (Today)</h3>
                        <Link to="/doctor/schedule" className="btn btn-sm btn-outline-primary">Full Schedule</Link>
                    </div>
                    <div className="table-responsive">
                        <table className="medical-ledger-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Patient</th>
                                    <th>Contact</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayAppointments.slice(0, 5).map((apt) => (
                                    <tr key={apt._id}>
                                        <td><strong>{apt.slotStartTime || apt.timeSlot}</strong></td>
                                        <td>{apt.patientId?.fullName}</td>
                                        <td>{apt.patientId?.mobile}</td>
                                        <td>
                                            <span className={`m-badge ${apt.bookingType === 'walkin' ? 'm-badge-purple' : 'm-badge-blue'}`}>
                                                {apt.bookingType === 'walkin' ? `Walk-in #${apt.tokenNumber}` : 'Appointment'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`m-badge ${
                                                apt.status === 'scheduled' ? 'm-badge-blue' :
                                                apt.status === 'in-progress' ? 'm-badge-yellow' :
                                                apt.status === 'completed' ? 'm-badge-green' : 'm-badge-gray'
                                            }`}>
                                                {apt.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="flex justify-center gap-2">
                                                <Link 
                                                    to={`/doctor/prescriptions?patientId=${apt.patientId?._id}&appointmentId=${apt._id}`} 
                                                    className="btn btn-sm btn-outline-primary" 
                                                    title="Suggest Medicine"
                                                    style={{ padding: '6px' }}
                                                >
                                                    💊
                                                </Link>
                                                <Link 
                                                    to={`/doctor/lab-requests?patientId=${apt.patientId?._id}`} 
                                                    className="btn btn-sm btn-outline-info" 
                                                    title="Request Lab Test"
                                                    style={{ padding: '6px' }}
                                                >
                                                    🧪
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {todayAppointments.length > 5 && (
                        <div className="p-md text-center border-t bg-gray-50/50" style={{ borderRadius: '0 0 20px 20px' }}>
                            <Link to="/doctor/schedule" className="text-sm font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest">
                                View all {todayAppointments.length} scheduled jobs →
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {upcomingOnly.length > 0 && (
                <div className="medical-ledger-container mt-lg">
                    <div className="medical-ledger-header">
                        <h3>Upcoming Consultations (Next 7 Days)</h3>
                        <Link to="/doctor/schedule" className="btn btn-sm btn-outline-secondary">Full Schedule</Link>
                    </div>
                    <div className="table-responsive">
                        <table className="medical-ledger-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Patient</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {upcomingOnly.slice(0, 8).map((apt) => (
                                    <tr key={apt._id}>
                                        <td>{new Date(apt.appointmentDate).toLocaleDateString()}</td>
                                        <td><strong>{apt.slotStartTime}</strong></td>
                                        <td>{apt.patientId?.fullName}</td>
                                        <td>
                                            <span className={`m-badge ${
                                                apt.status === 'scheduled' ? 'm-badge-blue' :
                                                apt.status === 'completed' ? 'm-badge-green' : 'm-badge-gray'
                                            }`}>
                                                {apt.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const PatientEMR = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const memberId = searchParams.get('memberId'); // null string or an actual id
    const [emr, setEmr] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            // Pass memberId (could be null string 'null' or an actual id)
            doctorAPI.getPatientEMR(id, memberId)
                .then(res => setEmr(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [id, memberId]);

    if (loading) return <div className="spinner"></div>;
    if (!emr) return <p>Patient not found</p>;

    const { patient, memberInfo, prescriptions, labTests, appointments } = emr;
    const isMember = memberId && memberId !== 'null';
    const displayName = isMember
        ? `${emr.memberInfo?.name || emr.prescriptions?.[0]?.bookedForMember?.memberName || 'Family Member'}`
        : patient?.fullName;
    const displayRelation = isMember
        ? (emr.memberInfo?.relation || emr.prescriptions?.[0]?.bookedForMember?.relation || '')
        : null;

    return (
        <div className="patient-emr-dashboard">
            <div className="flex justify-between items-center mb-lg">
                <Link to="/doctor/schedule" className="btn btn-sm btn-outline-secondary">← Back to Schedule</Link>
                <div className="m-badge m-badge-blue">Medical Record ID: {id?.slice(-6)}</div>
            </div>

            <div className="profile-dashboard">
                {/* Left Sidebar: Patient Profile */}
                <div className="profile-sidebar">
                    <div className="profile-avatar-card">
                        <div className="profile-avatar-large" style={getProfileImageUrl(patient?.profilePhoto) ? { padding: 0, overflow: 'hidden', background: 'transparent' } : {}}>
                            {getProfileImageUrl(patient?.profilePhoto) ? (
                                <img
                                    src={getProfileImageUrl(patient?.profilePhoto)}
                                    alt={displayName}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', borderRadius: '50%', display: 'block' }}
                                />
                            ) : (
                                isMember ? '👨‍👩‍👧' : displayName?.charAt(0) || 'P'
                            )}
                        </div>
                        <h2 className="mb-xs">{displayName}</h2>
                        {displayRelation && (
                            <div className="m-badge m-badge-purple mb-md">{displayRelation}</div>
                        )}
                        {!isMember && (
                            <div className="profile-stats-mini mt-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="card p-sm" style={{ textAlign: 'center' }}>
                                    <div className="text-xs text-gray-400 uppercase font-bold">Age</div>
                                    <div className="font-bold">{patient?.age || '—'}</div>
                                </div>
                                <div className="card p-sm" style={{ textAlign: 'center' }}>
                                    <div className="text-xs text-gray-400 uppercase font-bold">Blood</div>
                                    <div className="font-bold text-red-600">{patient?.bloodGroup || '—'}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card p-lg">
                        <h4 className="profile-section-title" style={{ marginBottom: '1rem' }}>Contact Info</h4>
                        <div className="profile-field mb-md">
                            <span className="profile-label">Phone</span>
                            <span className="profile-value">{patient?.mobile || 'No phone'}</span>
                        </div>
                        <div className="profile-field">
                            <span className="profile-label">Address</span>
                            <span className="profile-value text-sm">{patient?.address || 'No address provided'}</span>
                        </div>
                    </div>
                </div>

                {/* Right Main Content: Medical History */}
                <div className="profile-main">
                    {isMember && (
                        <div className="modern-stat-card mb-lg" style={{ borderLeft: '4px solid #7c3aed', background: '#f5f3ff' }}>
                            <div className="stat-icon-wrapper">👤</div>
                            <div className="stat-info">
                                <h3>Family Member Account</h3>
                                <p className="m-0 text-sm text-gray-600">
                                    Primary account holder: <strong>{patient?.fullName}</strong>
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-2 gap-lg mb-lg">
                        <div className="medical-ledger-container m-0">
                            <div className="medical-ledger-header">
                                <h3>Prescriptions</h3>
                                <span className="m-badge m-badge-blue">{prescriptions?.length || 0}</span>
                            </div>
                            <div className="p-lg" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {prescriptions?.length > 0 ? prescriptions.map((rx) => (
                                    <div key={rx._id} className="mb-lg pb-md border-b last:border-0">
                                        <div className="flex justify-between mb-xs">
                                            <span className="font-bold text-blue-600">{new Date(rx.createdAt).toLocaleDateString()}</span>
                                            <span className="text-xs font-bold uppercase text-gray-400">{rx.diagnosis}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">{rx.medicines?.map(m => m.name).join(', ')}</p>
                                    </div>
                                )) : <p className="text-center text-gray-400 py-lg">No previous prescriptions</p>}
                            </div>
                        </div>

                        <div className="medical-ledger-container m-0">
                            <div className="medical-ledger-header">
                                <h3>Lab Reports</h3>
                                <span className="m-badge m-badge-yellow">{labTests?.length || 0}</span>
                            </div>
                            <div className="p-lg" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {labTests?.length > 0 ? labTests.map((t) => (
                                    <div key={t._id} className="flex justify-between items-center mb-md pb-sm border-b last:border-0">
                                        <div>
                                            <div className="font-bold">{t.testType}</div>
                                            <div className="text-xs text-gray-500">{new Date(t.requestedDate).toLocaleDateString()}</div>
                                        </div>
                                        <span className={`m-badge ${t.status === 'completed' ? 'm-badge-green' : 'm-badge-yellow'}`}>
                                            {t.status}
                                        </span>
                                    </div>
                                )) : <p className="text-center text-gray-400 py-lg">No lab records found</p>}
                            </div>
                        </div>
                    </div>

                    <div className="medical-ledger-container">
                        <div className="medical-ledger-header">
                            <h3>Past Visits & Consultations</h3>
                        </div>
                        <div className="table-responsive">
                            <table className="medical-ledger-table">
                                <thead>
                                    <tr>
                                        <th>Visit Date</th>
                                        <th>Doctor</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments?.length > 0 ? (
                                        appointments.map((a) => (
                                            <tr key={a._id}>
                                                <td>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                                                <td><div className="flex items-center gap-2">👨‍⚕️ Dr. {a.doctorId?.fullName}</div></td>
                                                <td>
                                                    <span className={`m-badge ${
                                                        a.status === 'completed' ? 'm-badge-green' : 
                                                        a.status === 'reschedule_required' ? 'm-badge-red' : 'm-badge-blue'
                                                    }`}>
                                                        {a.status?.replace('_', ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="3" className="text-center text-gray-400 py-lg">No appointment history</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CreatePrescription = ({ doctorId }) => {
    const [searchParams] = useSearchParams();
    const paramPatientId = searchParams.get('patientId');
    const paramAppointmentId = searchParams.get('appointmentId');

    const [formData, setFormData] = useState({ 
        patientId: paramPatientId || '', 
        appointmentId: paramAppointmentId || '', 
        diagnosis: '', 
        notes: '', 
        medicines: [{ name: '', dosage: '', duration: '', instructions: '' }] 
    });
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (doctorId) {
            const today = new Date().toISOString().split('T')[0];
            appointmentAPI.getDoctorSchedule(doctorId, today).then(r => setAppointments(r.data || [])).catch(() => { });
        }
    }, [doctorId]);

    // Pre-select patient/appointment if params change
    useEffect(() => {
        if (paramPatientId && appointments.length > 0) {
            setFormData(f => ({ 
                ...f, 
                patientId: paramPatientId, 
                appointmentId: paramAppointmentId || f.appointmentId 
            }));
        }
    }, [paramPatientId, paramAppointmentId, appointments]);

    const addMedicine = () => setFormData(f => ({ ...f, medicines: [...f.medicines, { name: '', dosage: '', duration: '', instructions: '' }] }));
    const updateMedicine = (i, field, val) => {
        const m = [...formData.medicines]; m[i] = { ...m[i], [field]: val }; setFormData(f => ({ ...f, medicines: m }));
    };
    const removeMedicine = (i) => setFormData(f => ({ ...f, medicines: f.medicines.filter((_, idx) => idx !== i) }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId || !formData.diagnosis || formData.medicines.some(m => !m.name || !m.dosage || !m.duration)) {
            alert('Please fill required fields');
            return;
        }
        setLoading(true);
        try {
            console.log('📝 Creating prescription...', {
                patientId: formData.patientId,
                appointmentId: formData.appointmentId,
                diagnosis: formData.diagnosis,
                medicinesCount: formData.medicines.length
            });

            await doctorAPI.createPrescription({
                patientId: formData.patientId,
                appointmentId: formData.appointmentId || undefined,
                diagnosis: formData.diagnosis,
                notes: formData.notes,
                medicines: formData.medicines.filter(m => m.name),
                labTestsRequested: [] // Required by backend, even if empty
            });

            console.log('✅ Prescription created successfully!');
            setSuccess('Prescription created & sent to pharmacy!');
            setFormData({ patientId: '', appointmentId: '', diagnosis: '', notes: '', medicines: [{ name: '', dosage: '', duration: '', instructions: '' }] });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('❌ Prescription creation failed:', {
                status: err.response?.status,
                statusText: err.response?.statusText,
                message: err.response?.data?.message,
                fullError: err.response?.data
            });
            const errorMsg = err.response?.data?.message || err.message || 'Failed to create prescription';
            alert(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const allApts = [...new Map(appointments.map(a => [a.patientId?._id || a.patientId, a])).values()];

    return (
        <div className="form-page-container">
            <h1 className="mb-lg">Create E-Prescription</h1>
            {success && <div className="m-badge m-badge-green mb-lg p-md" style={{ width: '100%', borderRadius: '12px' }}>✅ {success}</div>}
            
            <form onSubmit={handleSubmit} className="card p-xl" style={{ maxWidth: '800px' }}>
                <div className="grid grid-2 gap-md mb-lg">
                    <div className="form-group">
                        <label className="profile-label">Select Patient (Today's Appts)</label>
                        <select className="input" value={formData.patientId} onChange={(e) => setFormData(f => ({ ...f, patientId: e.target.value, appointmentId: allApts.find(a => (a.patientId?._id || a.patientId) === e.target.value)?._id || '' }))} required>
                            <option value="">-- Choose Patient --</option>
                            {allApts.map((a) => (
                                <option key={a._id} value={a.patientId?._id || a.patientId}>
                                    {a.patientId?.fullName} - {new Date(a.appointmentDate).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                    </div>
                    {formData.patientId && (
                        <div className="form-group">
                            <label className="profile-label">Appointment Reference</label>
                            <select className="input" value={formData.appointmentId} onChange={(e) => setFormData(f => ({ ...f, appointmentId: e.target.value }))}>
                                <option value="">-- No specific appointment --</option>
                                {appointments.filter(a => (a.patientId?._id || a.patientId) === formData.patientId).map((a) => (
                                    <option key={a._id} value={a._id}>{new Date(a.appointmentDate).toLocaleString()}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="form-group mb-xl">
                    <label className="profile-label">Final Diagnosis *</label>
                    <input className="input" value={formData.diagnosis} onChange={(e) => setFormData(f => ({ ...f, diagnosis: e.target.value }))} placeholder="e.g. Acute Bacterial Pharyngitis" required />
                </div>

                <h4 className="profile-section-title">Medication Details</h4>
                {formData.medicines.map((med, i) => (
                    <div key={i} className="card p-md mb-md" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                        <div className="flex justify-between items-center mb-md">
                            <strong className="text-blue-600">Medicine #{i + 1}</strong>
                            {formData.medicines.length > 1 && (
                                <button type="button" onClick={() => removeMedicine(i)} className="btn btn-sm btn-outline-danger" style={{ padding: '2px 8px' }}>Remove</button>
                            )}
                        </div>
                        <div className="grid grid-2 gap-md">
                            <div className="form-group m-0">
                                <MedicineAutocomplete 
                                    placeholder="Medicine Search..." 
                                    onSelect={(selected) => updateMedicine(i, 'name', selected.name)} 
                                    clearOnSelect={false}
                                />
                            </div>
                            <input className="input" placeholder="Dosage (e.g. 500mg)" value={med.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)} required />
                            <input className="input" placeholder="Duration (e.g. 5 Days)" value={med.duration} onChange={(e) => updateMedicine(i, 'duration', e.target.value)} required />
                            <input className="input" placeholder="Instructions (e.g. After food)" value={med.instructions} onChange={(e) => updateMedicine(i, 'instructions', e.target.value)} />
                        </div>
                    </div>
                ))}

                <button type="button" onClick={addMedicine} className="btn btn-sm btn-outline-primary mb-xl">+ Add Another Medicine</button>

                <div className="form-group mb-xl">
                    <label className="profile-label">Additional Clinical Notes</label>
                    <textarea className="input" value={formData.notes} onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Any dietary or follow-up instructions..." />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', py: '1rem', fontSize: '1rem' }}>
                    {loading ? 'Processing...' : '💎 digitally Sign & Issue Prescription'}
                </button>
                <p className="text-xs text-center text-gray-500 mt-md">PDF will be generated and synced with Patient Dashboard & Pharmacy</p>
            </form>
        </div>
    );
};

const LabRequests = ({ doctorId }) => {
    const [searchParams] = useSearchParams();
    const paramPatientId = searchParams.get('patientId');

    const [formData, setFormData] = useState({ 
        patientId: paramPatientId || '', 
        testType: '', 
        description: '' 
    });
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (doctorId) {
            const today = new Date().toISOString().split('T')[0];
            appointmentAPI.getDoctorSchedule(doctorId, today).then(r => setAppointments(r.data || [])).catch(() => { });
        }
    }, [doctorId]);

    useEffect(() => {
        if (paramPatientId) {
            setFormData(f => ({ ...f, patientId: paramPatientId }));
        }
    }, [paramPatientId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId || !formData.testType) {
            alert('Patient and Test Type required');
            return;
        }
        setLoading(true);
        try {
            await doctorAPI.requestLabTest(formData);
            setSuccess('Lab test requested. Lab will be notified.');
            setFormData({ patientId: '', testType: '', description: '' });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        } finally {
            setLoading(false);
        }
    };

    const uniquePatients = [...new Map(appointments.map(a => [a.patientId?._id || a.patientId, a.patientId])).entries()];

    return (
        <div className="form-page-container">
            <h1 className="mb-lg">Request Lab Test</h1>
            {success && <div className="m-badge m-badge-green mb-lg p-md" style={{ width: '100%', borderRadius: '12px' }}>✅ {success}</div>}
            
            <form onSubmit={handleSubmit} className="card p-xl" style={{ maxWidth: '600px' }}>
                <div className="form-group mb-lg">
                    <label className="profile-label">Select Patient *</label>
                    <select className="input" value={formData.patientId} onChange={(e) => setFormData(f => ({ ...f, patientId: e.target.value }))} required>
                        <option value="">-- Choose Patient --</option>
                        {uniquePatients.map(([id, p]) => (
                            <option key={id} value={id}>{p?.fullName}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group mb-lg">
                    <label className="profile-label">Diagnostic Test Type *</label>
                    <DiagnosticTestAutocomplete 
                        placeholder="e.g. CBC, MRI Brain, Liver Function..." 
                        onSelect={(test) => setFormData(f => ({ ...f, testType: test.name }))} 
                        clearOnSelect={false}
                    />
                </div>

                <div className="form-group mb-xl">
                    <label className="profile-label">Specific Instructions or Notes</label>
                    <textarea className="input" value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="e.g. Fasting required, focus on thyroid markers..." />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', py: '1rem' }}>
                    {loading ? 'Requesting...' : '🔬 Send Request to Laboratory'}
                </button>
            </form>
        </div>
    );
};

const InsuranceClaimPage = ({ doctorId }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null); // { appointment, patient, prescription }
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);

    useEffect(() => {
        if (!doctorId) return;
        const today = new Date().toISOString().split('T')[0];
        appointmentAPI.getDoctorSchedule(doctorId, today)
            .then(r => setAppointments(r.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [doctorId]);

    const handleSelectAppointment = (apt) => {
        setSelected(apt);
        setSelectedPrescription(null);
        // Try to fetch prescriptions for this patient
        if (apt?.patientId?._id) {
            doctorAPI.getPatientEMR(apt.patientId._id)
                .then(r => setPrescriptions(r.data?.prescriptions || []))
                .catch(() => setPrescriptions([]));
        }
    };

    return (
        <div>
            <h1 className="mb-lg">🏥 Insurance Claim Generator</h1>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                Select a patient from today's appointments to generate an AI-powered insurance claim with ICD-10 & CPT medical codes.
            </p>

            <div className="grid grid-2" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* Left: Patient picker */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Today's Patients</h3>
                    {loading ? <div className="spinner"></div> : appointments.length === 0 ? (
                        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No appointments today.</p>
                    ) : (
                        appointments.map(apt => (
                            <div
                                key={apt._id}
                                onClick={() => handleSelectAppointment(apt)}
                                style={{
                                    padding: '12px 14px', borderRadius: 8, marginBottom: 8, cursor: 'pointer',
                                    border: selected?._id === apt._id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                    background: selected?._id === apt._id ? '#eff6ff' : '#f8fafc',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <p style={{ fontWeight: 600, margin: '0 0 2px', color: '#1e293b' }}>{apt.patientId?.fullName || 'Patient'}</p>
                                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                                    {apt.slotStartTime || apt.timeSlot} &nbsp;|&nbsp;
                                    <span className={`badge badge-${apt.status === 'completed' ? 'success' : 'info'}`} style={{ fontSize: 11 }}>{apt.status}</span>
                                </p>
                            </div>
                        ))
                    )}

                    {/* Prescription selector if patient selected */}
                    {selected && prescriptions.length > 0 && (
                        <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Link Prescription (optional)</label>
                            <select
                                className="input"
                                value={selectedPrescription?._id || ''}
                                onChange={e => setSelectedPrescription(prescriptions.find(p => p._id === e.target.value) || null)}
                            >
                                <option value="">-- No prescription --</option>
                                {prescriptions.map(p => (
                                    <option key={p._id} value={p._id}>
                                        {new Date(p.createdAt).toLocaleDateString()} — {p.diagnosis}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Right: Claim Assistant */}
                <div>
                    {selected ? (
                        <InsuranceClaimAssistant
                            appointment={selected}
                            patient={selected.patientId}
                            prescription={selectedPrescription}
                        />
                    ) : (
                        <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 12, padding: '40px', textAlign: 'center' }}>
                            <p style={{ fontSize: 36, margin: '0 0 12px' }}>👈</p>
                            <p style={{ color: '#64748b', fontWeight: 500 }}>Select a patient on the left to begin</p>
                            <p style={{ color: '#94a3b8', fontSize: 13 }}>AI will generate ICD-10 & CPT codes and a claim narrative</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
