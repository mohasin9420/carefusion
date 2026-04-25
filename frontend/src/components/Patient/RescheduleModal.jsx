import { useState, useEffect } from 'react';
import { appointmentAPI, availabilityAPI } from '../../services/api';
import './RescheduleModal.css';

const RescheduleModal = ({ appointment, onClose, onSuccess }) => {
    const [newDate, setNewDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [postponeCharge, setPostponeCharge] = useState(100);
    const [loading, setLoading] = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch default postpone charge
    useEffect(() => {
        appointmentAPI.getPostponeCharge(appointment._id)
            .then(res => setPostponeCharge(res.data.defaultCharge || 100))
            .catch(() => { });
    }, [appointment._id]);

    // Fetch slots when date changes
    useEffect(() => {
        if (!newDate) return;
        setSlotsLoading(true);
        setAvailableSlots([]);
        setSelectedSlot(null);
        const doctorId = appointment.doctorId?._id || appointment.doctorId;
        availabilityAPI.getAvailableSlots(doctorId, newDate)
            .then(res => setAvailableSlots(res.data || []))
            .catch(() => setError('Could not load slots for selected date'))
            .finally(() => setSlotsLoading(false));
    }, [newDate, appointment.doctorId]);

    const today = new Date().toISOString().split('T')[0];

    const handleConfirm = async () => {
        if (!newDate || !selectedSlot) {
            setError('Please pick a new date and time slot.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await appointmentAPI.rescheduleAppointment(appointment._id, {
                newDate,
                newSlotStartTime: selectedSlot.startTime,
                newSlotEndTime: selectedSlot.endTime,
                postponeCharge,
                rescheduleNote: 'Rescheduled by patient'
            });
            onSuccess(`Appointment rescheduled to ${new Date(newDate).toLocaleDateString()} at ${selectedSlot.startTime}. Postponement charge of ₹${postponeCharge} applies.`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reschedule appointment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="reschedule-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📅 Reschedule Appointment</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Scrollable body */}
                <div className="modal-body">
                    {/* Current appointment info */}
                    <div className="current-apt-info">
                        <div className="info-label">Current Appointment</div>
                        <div className="info-row">
                            <span>👨‍⚕️ Dr. {appointment.doctorId?.fullName}</span>
                            <span>📅 {new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                            <span>🕐 {appointment.slotStartTime} – {appointment.slotEndTime}</span>
                        </div>
                    </div>

                    {/* Postpone charge warning */}
                    <div className="charge-warning">
                        <span className="warn-icon">⚠️</span>
                        <span>
                            A <strong>postponement charge of ₹{postponeCharge}</strong> will be added to your consultation fee.
                        </span>
                    </div>

                    {/* Date picker */}
                    <div className="form-group">
                        <label>Select New Date</label>
                        <input
                            type="date"
                            min={today}
                            value={newDate}
                            onChange={e => { setNewDate(e.target.value); setError(''); }}
                            className="date-input"
                        />
                    </div>

                    {/* Slot selector */}
                    {newDate && (
                        <div className="form-group">
                            <label>Available Time Slots</label>
                            {slotsLoading ? (
                                <div className="slots-loading">Loading slots…</div>
                            ) : availableSlots.length > 0 ? (
                                <div className="slots-grid">
                                    {availableSlots.map((slot, i) => (
                                        <button
                                            key={i}
                                            className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                                            onClick={() => setSelectedSlot(slot)}
                                        >
                                            {slot.startTime} – {slot.endTime}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-slots">No available slots for this date. Try another day.</div>
                            )}
                        </div>
                    )}

                    {error && <div className="modal-error">⚠️ {error}</div>}
                </div>

                {/* Pinned footer – always visible */}
                <div className="modal-actions">
                    <button className="btn btn-outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={loading || !selectedSlot}
                    >
                        {loading ? 'Rescheduling…' : `Confirm & Pay ₹${postponeCharge}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RescheduleModal;
