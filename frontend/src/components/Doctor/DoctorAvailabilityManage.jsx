import { useState, useEffect } from 'react';
import { availabilityAPI } from '../../services/api';

const DoctorAvailabilityManage = () => {
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({
        blockedDate: new Date().toISOString().split('T')[0],
        reason: 'leave',
        isFullDay: true,
        startTime: '09:00',
        endTime: '12:00',
        notes: ''
    });

    const loadBlocked = () => {
        availabilityAPI.getMyBlockedSlots()
            .then(res => setBlockedSlots(res.data || []))
            .catch(() => setBlockedSlots([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadBlocked();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            const payload = {
                blockedDate: form.blockedDate,
                reason: form.reason,
                isFullDay: form.isFullDay,
                notes: form.notes || undefined
            };
            if (!form.isFullDay) {
                payload.startTime = form.startTime;
                payload.endTime = form.endTime;
            }
            const res = await availabilityAPI.blockMySlots(payload);
            setSuccess(res.data.message + (res.data.affectedAppointments > 0 ? ` ${res.data.affectedAppointments} patient(s) will be notified to reschedule.` : ''));
            setForm({ ...form, blockedDate: new Date().toISOString().split('T')[0], notes: '' });
            loadBlocked();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to block slots');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUnblock = async (id) => {
        try {
            await availabilityAPI.unblockMySlot(id);
            setSuccess('Slot unblocked.');
            loadBlocked();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to unblock');
        }
    };

    const reasonLabels = {
        leave: 'Full-day leave',
        emergency: 'Emergency unavailability',
        conference: 'Conference / CME',
        surgery: 'Surgery / Procedure',
        other: 'Other'
    };

    return (
        <div>
            <h1 className="mb-lg">Manage Availability</h1>
            <p className="text-gray-600 mb-lg">Mark full-day leave, block partial time slots, or mark emergency unavailability. If you block time after appointments are confirmed, those appointments will be set to &quot;Reschedule Required&quot; and patients will receive a notification with suggested new slots.</p>

            {error && <div className="alert alert-error mb-md">{error}</div>}
            {success && <div className="alert alert-success mb-md">{success}</div>}

            <div className="card mb-lg" style={{ maxWidth: '560px' }}>
                <h3 className="mb-md">Block Time</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-md">
                        <label>Date *</label>
                        <input
                            type="date"
                            className="input"
                            value={form.blockedDate}
                            onChange={(e) => setForm(f => ({ ...f, blockedDate: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>
                    <div className="form-group mb-md">
                        <label>Reason</label>
                        <select
                            className="input"
                            value={form.reason}
                            onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
                        >
                            {Object.entries(reasonLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group mb-md">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={form.isFullDay}
                                onChange={(e) => setForm(f => ({ ...f, isFullDay: e.target.checked }))}
                            />
                            Full-day leave
                        </label>
                    </div>
                    {!form.isFullDay && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label>Start time</label>
                                <input
                                    type="time"
                                    className="input"
                                    value={form.startTime}
                                    onChange={(e) => setForm(f => ({ ...f, startTime: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>End time</label>
                                <input
                                    type="time"
                                    className="input"
                                    value={form.endTime}
                                    onChange={(e) => setForm(f => ({ ...f, endTime: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}
                    <div className="form-group mb-md">
                        <label>Notes (optional)</label>
                        <textarea
                            className="input"
                            rows={2}
                            value={form.notes}
                            onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder="e.g. Emergency leave"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Block Time'}
                    </button>
                </form>
            </div>

            <div className="card">
                <h3 className="mb-md">Your Blocked Slots</h3>
                {loading ? (
                    <div className="spinner"></div>
                ) : blockedSlots.length === 0 ? (
                    <p className="text-gray-500">No blocked slots.</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Reason</th>
                                <th>Notes</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {blockedSlots.map((b) => (
                                <tr key={b._id}>
                                    <td>{new Date(b.blockedDate).toLocaleDateString()}</td>
                                    <td>{b.isFullDay ? 'Full day' : `${b.startTime} – ${b.endTime}`}</td>
                                    <td>{reasonLabels[b.reason] || b.reason}</td>
                                    <td>{b.notes || '—'}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => handleUnblock(b._id)}
                                        >
                                            Unblock
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DoctorAvailabilityManage;
