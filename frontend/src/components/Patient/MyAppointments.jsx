import { useState, useEffect } from 'react';
import { appointmentAPI } from '../../services/api';
import RescheduleModal from './RescheduleModal';
import './MyAppointments.css';

const MyAppointments = ({ patientId }) => {
    const [appointments, setAppointments] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [rescheduleTarget, setRescheduleTarget] = useState(null);

    useEffect(() => {
        if (patientId) fetchAppointments();
    }, [patientId]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await appointmentAPI.getMyAppointments(patientId);
            setAppointments(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAppointment = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            await appointmentAPI.cancelAppointment(id);
            setSuccess('Appointment cancelled successfully');
            fetchAppointments();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error(err);
            setError('Failed to cancel appointment');
        }
    };

    const handleRescheduleSuccess = (message) => {
        setRescheduleTarget(null);
        setSuccess(message);
        fetchAppointments();
        setTimeout(() => setSuccess(''), 6000);
    };

    const getFilteredAppointments = () => {
        if (filterStatus === 'all') return appointments;
        if (filterStatus === 'upcoming') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return appointments.filter(apt =>
                new Date(apt.appointmentDate) >= today && apt.status === 'scheduled'
            );
        }
        if (filterStatus === 'past') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return appointments.filter(apt =>
                new Date(apt.appointmentDate) < today || ['completed', 'no-show'].includes(apt.status)
            );
        }
        return appointments.filter(apt => apt.status === filterStatus);
    };

    const getStatusBadge = (status) => {
        const badges = {
            scheduled: 'badge-primary',
            'in-progress': 'badge-warning',
            completed: 'badge-success',
            cancelled: 'badge-danger',
            'no-show': 'badge-secondary'
        };
        return badges[status] || 'badge-secondary';
    };

    // Returns an extra badge showing staff approval state (only when not yet approved)
    const getApprovalBadge = (apt) => {
        const s = apt.staffApprovalStatus;
        if (!s || s === 'approved') return null;
        if (s === 'pending_review') return (
            <span className="badge badge-warning" style={{ marginLeft: '0.4rem', fontSize: '0.75rem' }}>
                ⏳ Awaiting Staff Review
            </span>
        );
        if (s === 'rejected') return (
            <span className="badge badge-danger" style={{ marginLeft: '0.4rem', fontSize: '0.75rem' }}>
                ❌ Not Approved — Please contact hospital
            </span>
        );
        return null;
    };

    const getStatusText = (status) =>
        status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

    const canCancel = (appointment) => {
        const aptDate = new Date(appointment.appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return appointment.status === 'scheduled' && aptDate >= today;
    };

    const canReschedule = (appointment) => {
        const aptDate = new Date(appointment.appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return appointment.status === 'scheduled' && aptDate >= today;
    };

    const filteredAppointments = getFilteredAppointments();

    return (
        <div className="my-appointments-container">
            <h1>My Appointments</h1>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {/* Filter Tabs */}
            <div className="filter-tabs">
                {['all', 'upcoming', 'past', 'cancelled'].map(f => (
                    <button
                        key={f}
                        className={`tab ${filterStatus === f ? 'active' : ''}`}
                        onClick={() => setFilterStatus(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Appointments List */}
            {loading ? (
                <div className="spinner" />
            ) : filteredAppointments.length > 0 ? (
                <div className="appointments-list">
                    {filteredAppointments.map(appointment => (
                        <div key={appointment._id} className="appointment-card">
                            <div className="appointment-header">
                                <div>
                                    <h3>{appointment.doctorId?.fullName}</h3>
                                    <p className="specialization">
                                        {appointment.doctorId?.specialization} - {appointment.doctorId?.department}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' }}>
                                    <span className={`badge ${getStatusBadge(appointment.status)}`}>
                                        {getStatusText(appointment.status)}
                                    </span>
                                    {getApprovalBadge(appointment)}
                                </div>
                            </div>

                            <div className="appointment-details">
                                <div className="detail-row">
                                    <span className="icon">📅</span>
                                    <span>{formatDate(appointment.appointmentDate)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="icon">🕐</span>
                                    <span>{appointment.slotStartTime} - {appointment.slotEndTime}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="icon">🏥</span>
                                    <span>{appointment.visitType}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="icon">👤</span>
                                    <span>
                                        <strong>For: </strong>
                                        {appointment.bookedForMember?.memberId
                                            ? `${appointment.bookedForMember.memberName} (${appointment.bookedForMember.relation})`
                                            : 'Self (Main Account)'}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="icon">💰</span>
                                    <span>₹{appointment.consultationCharge}</span>
                                </div>
                                {appointment.bookingType === 'walkin' && (
                                    <div className="detail-row">
                                        <span className="icon">🎫</span>
                                        <span>Token #{appointment.tokenNumber}</span>
                                    </div>
                                )}
                                {appointment.rescheduleCount > 0 && (
                                    <div className="detail-row reschedule-info">
                                        <span className="icon">🔄</span>
                                        <span>
                                            Rescheduled {appointment.rescheduleCount}x
                                            {appointment.postponeCharge > 0 && ` · Postpone charge: ₹${appointment.postponeCharge}`}
                                            {appointment.rescheduleNote && ` · ${appointment.rescheduleNote}`}
                                        </span>
                                    </div>
                                )}
                                {/* Payment Status */}
                                <div className="detail-row payment-info" style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <span className="icon">💰</span>
                                    <span>
                                        <strong>Payment: </strong>
                                        <span className={`badge badge-${appointment.paymentDetails?.paymentStatus === 'verified' ? 'success' : appointment.paymentDetails?.paymentStatus === 'rejected' ? 'danger' : 'warning'}`} style={{ fontSize: '0.7rem' }}>
                                            {appointment.paymentDetails?.paymentStatus || 'pending'}
                                        </span>
                                        {appointment.paymentDetails?.transactionId && (
                                            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                                                (UTR: {appointment.paymentDetails.transactionId})
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Show action buttons only if not rejected */}
                            {(canCancel(appointment) || canReschedule(appointment)) &&
                                appointment.staffApprovalStatus !== 'rejected' && (
                                    <div className="appointment-actions">
                                        {canReschedule(appointment) && (
                                            <button
                                                onClick={() => setRescheduleTarget(appointment)}
                                                className="btn btn-sm btn-warning"
                                            >
                                                📅 Reschedule
                                            </button>
                                        )}
                                        {canCancel(appointment) && (
                                            <button
                                                onClick={() => handleCancelAppointment(appointment._id)}
                                                className="btn btn-sm btn-danger"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No Appointments Found</h3>
                    <p>You don't have any {filterStatus !== 'all' ? filterStatus : ''} appointments.</p>
                </div>
            )}

            {/* Reschedule Modal */}
            {rescheduleTarget && (
                <RescheduleModal
                    appointment={rescheduleTarget}
                    onClose={() => setRescheduleTarget(null)}
                    onSuccess={handleRescheduleSuccess}
                />
            )}
        </div>
    );
};

export default MyAppointments;
