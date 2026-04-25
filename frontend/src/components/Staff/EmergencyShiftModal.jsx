import { useState, useEffect } from 'react';
import { appointmentAPI } from '../../services/api';
import './EmergencyShiftModal.css';

const EmergencyShiftModal = ({ selectedDate, doctors, onClose, onSuccess }) => {
    const [doctorId, setDoctorId] = useState('');
    const [fromDate, setFromDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');
    const [postponeCharge, setPostponeCharge] = useState(100);
    const [affectedCount, setAffectedCount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [error, setError] = useState('');

    // Preview how many appointments will be affected
    useEffect(() => {
        if (!doctorId || !fromDate) { setAffectedCount(null); return; }
        setPreviewLoading(true);
        appointmentAPI.getAllAppointments({ doctorId, date: fromDate, status: 'scheduled' })
            .then(res => {
                const scheduled = (res.data || []).filter(a => a.status === 'scheduled');
                setAffectedCount(scheduled.length);
            })
            .catch(() => setAffectedCount(null))
            .finally(() => setPreviewLoading(false));
    }, [doctorId, fromDate]);

    const today = new Date().toISOString().split('T')[0];

    const handleShift = async () => {
        if (!doctorId || !fromDate || !toDate) {
            setError('Please select a doctor, from-date, and to-date.');
            return;
        }
        if (fromDate === toDate) {
            setError('From-date and To-date cannot be the same day.');
            return;
        }
        if (!reason.trim()) {
            setError('Please provide a reason for the emergency shift.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await appointmentAPI.emergencyShift({
                doctorId,
                fromDate,
                toDate,
                reason: reason.trim(),
                postponeCharge: Number(postponeCharge) || 100
            });
            onSuccess(res.data.message, res.data.shifted);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to shift appointments');
        } finally {
            setLoading(false);
        }
    };

    const selectedDoctor = doctors.find(d => d._id === doctorId);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="emergency-modal" onClick={e => e.stopPropagation()}>
                <div className="em-header">
                    <div className="em-title">
                        <span className="em-icon">🚨</span>
                        <h2>Emergency Appointment Shift</h2>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="em-body">
                    <p className="em-desc">
                        Move all <strong>scheduled</strong> appointments for a doctor on a specific day to a new date.
                        All affected patients will receive an in-app notification.
                    </p>

                    {/* Doctor selector */}
                    <div className="em-form-group">
                        <label>Select Doctor *</label>
                        <select value={doctorId} onChange={e => setDoctorId(e.target.value)} className="em-select">
                            <option value="">— Choose a doctor —</option>
                            {doctors.map(doc => (
                                <option key={doc._id} value={doc._id}>
                                    Dr. {doc.fullName} – {doc.specialization}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date row */}
                    <div className="em-date-row">
                        <div className="em-form-group">
                            <label>From Date (Emergency Day) *</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={e => { setFromDate(e.target.value); setError(''); }}
                                className="em-input"
                            />
                        </div>
                        <div className="em-arrow">→</div>
                        <div className="em-form-group">
                            <label>Shift To Date *</label>
                            <input
                                type="date"
                                min={today}
                                value={toDate}
                                onChange={e => { setToDate(e.target.value); setError(''); }}
                                className="em-input"
                            />
                        </div>
                    </div>

                    {/* Affected preview */}
                    {doctorId && fromDate && (
                        <div className={`em-preview ${affectedCount === 0 ? 'none' : affectedCount > 0 ? 'has-apts' : ''}`}>
                            {previewLoading ? (
                                <span>Checking affected appointments…</span>
                            ) : affectedCount === null ? (
                                <span>Could not load appointment count.</span>
                            ) : affectedCount === 0 ? (
                                <span>✅ No scheduled appointments found for {selectedDoctor?.fullName} on this date.</span>
                            ) : (
                                <span>
                                    ⚠️ <strong>{affectedCount} scheduled appointment{affectedCount !== 1 ? 's' : ''}</strong>
                                    {' '}for Dr. {selectedDoctor?.fullName} will be moved.
                                </span>
                            )}
                        </div>
                    )}

                    {/* Reason */}
                    <div className="em-form-group">
                        <label>Reason for Emergency *</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="e.g. Doctor hospitalised, family emergency, unavailability…"
                            className="em-textarea"
                            rows={3}
                        />
                    </div>

                    {/* Postpone charge */}
                    <div className="em-form-group">
                        <label>Postponement Charge per Appointment (₹)</label>
                        <div className="em-charge-row">
                            <input
                                type="number"
                                min="0"
                                value={postponeCharge}
                                onChange={e => setPostponeCharge(e.target.value)}
                                className="em-input"
                                style={{ maxWidth: 140 }}
                            />
                            <span className="em-charge-note">Default ₹100 · Staff can override</span>
                        </div>
                    </div>

                    {error && <div className="em-error">⚠️ {error}</div>}
                </div>

                <div className="em-footer">
                    <button className="em-btn-cancel" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        className="em-btn-confirm"
                        onClick={handleShift}
                        disabled={loading || !doctorId || !fromDate || !toDate || affectedCount === 0}
                    >
                        {loading ? 'Shifting…' : `🚨 Shift ${affectedCount ?? ''} Appointments`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmergencyShiftModal;
