import { useState, useEffect } from 'react';
import { availabilityAPI } from '../../services/api';
import './BlockSlots.css';

const BlockSlots = () => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        blockedDate: '',
        isFullDay: true,
        startTime: '09:00',
        endTime: '17:00',
        reason: 'leave',
        notes: ''
    });

    useEffect(() => {
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (selectedDoctor) {
            fetchBlockedSlots();
        }
    }, [selectedDoctor]);

    const fetchDoctors = async () => {
        try {
            const response = await availabilityAPI.getAllDoctorsAvailability();
            setDoctors(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load doctors');
        }
    };

    const fetchBlockedSlots = async () => {
        try {
            const response = await availabilityAPI.getBlockedSlots(selectedDoctor);
            setBlockedSlots(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const data = {
                doctorId: selectedDoctor,
                blockedDate: formData.blockedDate,
                isFullDay: formData.isFullDay,
                reason: formData.reason,
                notes: formData.notes
            };

            if (!formData.isFullDay) {
                data.startTime = formData.startTime;
                data.endTime = formData.endTime;
            }

            const response = await availabilityAPI.blockSlots(data);

            if (formData.isFullDay && response.data.cancelledCount > 0) {
                setSuccess(`Slots blocked successfully! ${response.data.cancelledCount} appointments were cancelled.`);
            } else {
                setSuccess('Slots blocked successfully!');
            }

            // Reset form
            setFormData({
                blockedDate: '',
                isFullDay: true,
                startTime: '09:00',
                endTime: '17:00',
                reason: 'leave',
                notes: ''
            });

            // Refresh blocked slots
            fetchBlockedSlots();

            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to block slots');
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (id) => {
        if (!window.confirm('Are you sure you want to unblock these slots?')) {
            return;
        }

        try {
            await availabilityAPI.unblockSlots(id);
            setSuccess('Slots unblocked successfully!');
            fetchBlockedSlots();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to unblock slots');
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getReasonBadge = (reason) => {
        const badges = {
            leave: 'badge-warning',
            emergency: 'badge-danger',
            conference: 'badge-info',
            surgery: 'badge-primary',
            other: 'badge-secondary'
        };
        return badges[reason] || 'badge-secondary';
    };

    return (
        <div className="block-slots-container">
            <h1>Block Doctor Slots</h1>
            <p className="subtitle">Block specific dates or time slots for doctor unavailability</p>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="grid-layout">
                {/* Block Form */}
                <div className="card">
                    <h2>Block New Slots</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label">Select Doctor *</label>
                            <select
                                className="input"
                                value={selectedDoctor}
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                                required
                            >
                                <option value="">-- Select a Doctor --</option>
                                {doctors.map(doctor => (
                                    <option key={doctor._id} value={doctor._id}>
                                        {doctor.fullName} - {doctor.specialization}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedDoctor && (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Date *</label>
                                    <input
                                        type="date"
                                        name="blockedDate"
                                        className="input"
                                        value={formData.blockedDate}
                                        onChange={handleInputChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="isFullDay"
                                            checked={formData.isFullDay}
                                            onChange={handleInputChange}
                                        />
                                        <span>Block Full Day</span>
                                    </label>
                                </div>

                                {!formData.isFullDay && (
                                    <div className="time-range">
                                        <div className="input-group">
                                            <label className="input-label">Start Time</label>
                                            <input
                                                type="time"
                                                name="startTime"
                                                className="input"
                                                value={formData.startTime}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">End Time</label>
                                            <input
                                                type="time"
                                                name="endTime"
                                                className="input"
                                                value={formData.endTime}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="input-group">
                                    <label className="input-label">Reason *</label>
                                    <select
                                        name="reason"
                                        className="input"
                                        value={formData.reason}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="leave">Leave</option>
                                        <option value="emergency">Emergency</option>
                                        <option value="conference">Conference</option>
                                        <option value="surgery">Surgery</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Notes</label>
                                    <textarea
                                        name="notes"
                                        className="input"
                                        rows="3"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        placeholder="Additional notes..."
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Blocking...' : 'Block Slots'}
                                </button>
                            </>
                        )}
                    </form>
                </div>

                {/* Blocked Slots List */}
                <div className="card">
                    <h2>Currently Blocked Slots</h2>
                    {selectedDoctor ? (
                        blockedSlots.length > 0 ? (
                            <div className="blocked-list">
                                {blockedSlots.map(slot => (
                                    <div key={slot._id} className="blocked-item">
                                        <div className="blocked-header">
                                            <span className="blocked-date">{formatDate(slot.blockedDate)}</span>
                                            <span className={`badge ${getReasonBadge(slot.reason)}`}>
                                                {slot.reason}
                                            </span>
                                        </div>
                                        <div className="blocked-details">
                                            {slot.isFullDay ? (
                                                <span className="text-sm">Full Day Block</span>
                                            ) : (
                                                <span className="text-sm">{slot.startTime} - {slot.endTime}</span>
                                            )}
                                        </div>
                                        {slot.notes && (
                                            <p className="blocked-notes">{slot.notes}</p>
                                        )}
                                        <button
                                            onClick={() => handleUnblock(slot._id)}
                                            className="btn btn-sm btn-danger"
                                        >
                                            Unblock
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray">No blocked slots for this doctor</p>
                        )
                    ) : (
                        <p className="text-gray">Select a doctor to view blocked slots</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlockSlots;
