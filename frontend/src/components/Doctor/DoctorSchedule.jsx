import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentAPI, doctorAPI } from '../../services/api';
import ConsultationModal from './ConsultationModal';
import './DoctorSchedule.css';

const DoctorSchedule = ({ doctorId }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const [consultationAppointment, setConsultationAppointment] = useState(null);

    useEffect(() => {
        if (doctorId && selectedDate) {
            fetchSchedule();
        }
    }, [doctorId, selectedDate]);

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const response = await appointmentAPI.getDoctorSchedule(doctorId, selectedDate);
            setAppointments(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load schedule');
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
            fetchSchedule();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const handlePrescriptionSubmit = async (prescriptionData) => {
        setLoading(true);
        setError('');
        try {
            await doctorAPI.createPrescription(prescriptionData);
            setSuccess('Prescription issued successfully!');
            setConsultationAppointment(null);
            fetchSchedule();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error('Prescription error:', err);
            setError(err.response?.data?.message || 'Failed to issue prescription');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            scheduled: 'badge-primary',
            'in-progress': 'badge-warning',
            completed: 'badge-success',
            'no-show': 'badge-danger',
            reschedule_required: 'badge-danger',
            cancelled: 'badge-secondary'
        };
        return badges[status] || 'badge-secondary';
    };

    const getBookingTypeBadge = (type) => {
        return type === 'walkin' ? 'badge-walkin' : 'badge-appointment';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStats = () => {
        const total = appointments.length;
        const completed = appointments.filter(a => a.status === 'completed').length;
        const inProgress = appointments.filter(a => a.status === 'in-progress').length;
        const scheduled = appointments.filter(a => a.status === 'scheduled').length;
        const noShow = appointments.filter(a => a.status === 'no-show').length;
        const walkIns = appointments.filter(a => a.bookingType === 'walkin').length;

        return { total, completed, inProgress, scheduled, noShow, walkIns };
    };

    const stats = getStats();

    return (
        <div className="doctor-schedule-container dashboard-doctor">
            <div className="flex justify-between items-end mb-lg mobile-stack">
                <div>
                    <h1 className="m-0 text-3xl font-black">Clinical Schedule</h1>
                    <div className="text-gray-500 font-medium">{formatDate(selectedDate)}</div>
                </div>
                <div className="date-selector">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="input"
                        style={{ width: 'auto' }}
                    />
                </div>
            </div>

            {success && <div className="m-badge m-badge-green mb-lg p-md w-full" style={{ borderRadius: '12px' }}>✅ {success}</div>}
            {error && <div className="m-badge m-badge-red mb-lg p-md w-full" style={{ borderRadius: '12px' }}>⚠️ {error}</div>}

            {/* Statistics Cards */}
            <div className="modern-stat-grid">
                <div className="modern-stat-card">
                    <div className="stat-icon-wrapper">📅</div>
                    <div className="stat-info">
                        <h3>Total Patients</h3>
                        <div className="stat-value">{stats.total}</div>
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
                    <div className="stat-icon-wrapper" style={{ background: '#fef9c3', color: '#854d0e' }}>⏳</div>
                    <div className="stat-info">
                        <h3>In Progress</h3>
                        <div className="stat-value">{stats.inProgress}</div>
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

            {/* Appointments List */}
            {loading ? (
                <div className="spinner"></div>
            ) : (
                <>
                    {appointments.length > 0 ? (
                        <div className="medical-ledger-container">
                            <div className="medical-ledger-header">
                                <h3>Daily Timeline</h3>
                            </div>
                            <div className="appointments-timeline-modern p-lg">
                                {appointments.map((appointment) => (
                                    <div key={appointment._id} className={`timeline-item-premium ${appointment.status}`}>
                                        <div className="timeline-time-col">
                                            <div className="time-badge">{appointment.slotStartTime}</div>
                                            <div className="time-sub text-xs text-gray-400">Duration: 15m</div>
                                        </div>

                                        <div className="timeline-card-content card">
                                            <div className="flex justify-between items-start mb-md">
                                                <div>
                                                    {appointment.bookedForMember?.memberId ? (
                                                        <>
                                                            <h3 className="m-0 text-indigo-600">
                                                                {appointment.bookedForMember.memberName}
                                                                <span className="m-badge m-badge-purple ml-2">{appointment.bookedForMember.relation}</span>
                                                            </h3>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                👤 Account: <strong>{appointment.patientId?.fullName}</strong>
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <h3 className="m-0">{appointment.patientId?.fullName || 'Patient'}</h3>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className={`m-badge ${appointment.bookingType === 'walkin' ? 'm-badge-purple' : 'm-badge-blue'}`}>
                                                        {appointment.bookingType === 'walkin' ? `Walk-in #${appointment.tokenNumber}` : 'Online'}
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

                                            <div className="patient-quick-stats grid grid-3 gap-md mb-md mobile-stack">
                                                <div className="p-sm bg-gray-50 rounded-lg flex items-center gap-2">
                                                    <span className="text-gray-400">📞</span>
                                                    <span className="text-sm font-semibold">{appointment.patientId?.mobile || 'No Phone'}</span>
                                                </div>
                                                <div className="p-sm bg-gray-50 rounded-lg flex items-center gap-2">
                                                    <span className="text-gray-400">🎂</span>
                                                    <span className="text-sm font-semibold">{appointment.patientId?.age || '—'} Yrs</span>
                                                </div>
                                                <div className="p-sm bg-gray-50 rounded-lg flex items-center gap-2">
                                                    <span className="text-gray-400">👤</span>
                                                    <span className="text-sm font-semibold text-capitalize">{appointment.patientId?.gender || '—'}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mb-lg flex-wrap">
                                                <Link
                                                    to={`/doctor/patient/${appointment.patientId?._id}${appointment.bookedForMember?.memberId
                                                        ? `?memberId=${appointment.bookedForMember.memberId}`
                                                        : '?memberId=null'}`}
                                                    className="btn btn-sm btn-info px-4"
                                                >
                                                    View Chart
                                                </Link>
                                                <Link 
                                                    to={`/doctor/prescriptions?patientId=${appointment.patientId?._id}&appointmentId=${appointment._id}`} 
                                                    className="btn btn-sm btn-outline-primary px-4" 
                                                >
                                                    💊 Prescription
                                                </Link>
                                                <Link 
                                                    to={`/doctor/lab-requests?patientId=${appointment.patientId?._id}`} 
                                                    className="btn btn-sm btn-outline-warning px-4" 
                                                >
                                                    🧪 Lab Test
                                                </Link>
                                            </div>

                                            {appointment.initialDiagnosis && (
                                                <div style={{
                                                    margin: '0.6rem 0', padding: '0.6rem 0.9rem',
                                                    background: '#f0fdf4', borderLeft: '3px solid #22c55e',
                                                    borderRadius: '6px', fontSize: '0.875rem'
                                                }}>
                                                    <strong style={{ color: '#15803d' }}>📋 Initial Diagnosis (by Staff):</strong>
                                                    <p style={{ margin: '0.2rem 0 0', color: '#166534' }}>{appointment.initialDiagnosis}</p>
                                                </div>
                                            )}
                                            {appointment.staffNotes && (
                                                <div style={{
                                                    margin: '0.35rem 0 0.6rem', padding: '0.45rem 0.75rem',
                                                    background: '#f8fafc', borderLeft: '3px solid #94a3b8',
                                                    borderRadius: '6px', fontSize: '0.8rem', color: '#475569'
                                                }}>
                                                    <strong>Staff Notes:</strong> {appointment.staffNotes}
                                                </div>
                                            )}

                                            {appointment.status !== 'completed' && appointment.status !== 'no-show' && (
                                                <div className="action-buttons">
                                                    {appointment.status === 'scheduled' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(appointment._id, 'in-progress')}
                                                            className="btn btn-sm btn-primary"
                                                            disabled={updatingId === appointment._id}
                                                        >
                                                            {updatingId === appointment._id ? '...' : 'Start'}
                                                        </button>
                                                    )}
                                                    {appointment.status === 'in-progress' && (
                                                        <>
                                                            <button
                                                                onClick={() => setConsultationAppointment(appointment)}
                                                                className="btn btn-sm btn-primary"
                                                                style={{ background: '#4361ee', marginRight: '0.5rem' }}
                                                            >
                                                                🩺 Start Consultation
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                                                                className="btn btn-sm btn-success"
                                                                disabled={updatingId === appointment._id}
                                                            >
                                                                {updatingId === appointment._id ? '...' : 'Complete'}
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleStatusUpdate(appointment._id, 'no-show')}
                                                        className="btn btn-sm btn-danger"
                                                        disabled={updatingId === appointment._id}
                                                    >
                                                        {updatingId === appointment._id ? '...' : 'No Show'}
                                                    </button>
                                                </div>
                                            )}
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
                </>
            )}

            {/* Consultation Modal */}
            {consultationAppointment && (
                <ConsultationModal
                    appointment={consultationAppointment}
                    onClose={() => setConsultationAppointment(null)}
                    onPrescriptionSubmit={handlePrescriptionSubmit}
                />
            )}
        </div>
    );
};

export default DoctorSchedule;
