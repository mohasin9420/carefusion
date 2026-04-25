import { useState, useEffect } from 'react';
import { availabilityAPI } from '../../services/api';
import './DoctorAvailability.css';

const DoctorAvailability = () => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const daysOfWeek = [
        { name: 'Sunday', value: 0 },
        { name: 'Monday', value: 1 },
        { name: 'Tuesday', value: 2 },
        { name: 'Wednesday', value: 3 },
        { name: 'Thursday', value: 4 },
        { name: 'Friday', value: 5 },
        { name: 'Saturday', value: 6 }
    ];

    const [schedule, setSchedule] = useState({
        0: { enabled: false, startTime: '09:00', endTime: '17:00', slotDuration: 15, maxPatientsPerSlot: 1 },
        1: { enabled: true, startTime: '09:00', endTime: '17:00', slotDuration: 15, maxPatientsPerSlot: 1 },
        2: { enabled: true, startTime: '09:00', endTime: '17:00', slotDuration: 15, maxPatientsPerSlot: 1 },
        3: { enabled: true, startTime: '09:00', endTime: '17:00', slotDuration: 15, maxPatientsPerSlot: 1 },
        4: { enabled: true, startTime: '09:00', endTime: '17:00', slotDuration: 15, maxPatientsPerSlot: 1 },
        5: { enabled: true, startTime: '09:00', endTime: '17:00', slotDuration: 15, maxPatientsPerSlot: 1 },
        6: { enabled: false, startTime: '09:00', endTime: '17:00', slotDuration: 15, maxPatientsPerSlot: 1 }
    });

    useEffect(() => {
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (selectedDoctor) {
            loadDoctorSchedule();
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

    const loadDoctorSchedule = async () => {
        try {
            const response = await availabilityAPI.getDoctorAvailability(selectedDoctor);
            if (response.data && response.data.length > 0) {
                const existingSchedule = {};
                response.data.forEach(day => {
                    existingSchedule[day.dayOfWeek] = {
                        enabled: true,
                        startTime: day.startTime,
                        endTime: day.endTime,
                        slotDuration: day.slotDuration,
                        maxPatientsPerSlot: day.maxPatientsPerSlot
                    };
                });

                // Merge with default schedule
                const newSchedule = { ...schedule };
                Object.keys(existingSchedule).forEach(day => {
                    newSchedule[day] = existingSchedule[day];
                });
                setSchedule(newSchedule);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDayToggle = (dayValue) => {
        setSchedule({
            ...schedule,
            [dayValue]: {
                ...schedule[dayValue],
                enabled: !schedule[dayValue].enabled
            }
        });
    };

    const handleTimeChange = (dayValue, field, value) => {
        setSchedule({
            ...schedule,
            [dayValue]: {
                ...schedule[dayValue],
                [field]: value
            }
        });
    };

    const handleSaveSchedule = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Convert schedule to array format
            const scheduleArray = Object.keys(schedule)
                .filter(day => schedule[day].enabled)
                .map(day => ({
                    dayOfWeek: parseInt(day),
                    startTime: schedule[day].startTime,
                    endTime: schedule[day].endTime,
                    slotDuration: parseInt(schedule[day].slotDuration),
                    maxPatientsPerSlot: parseInt(schedule[day].maxPatientsPerSlot)
                }));

            if (scheduleArray.length === 0) {
                setError('Please select at least one day');
                setLoading(false);
                return;
            }

            await availabilityAPI.setDoctorAvailability({
                doctorId: selectedDoctor,
                schedule: scheduleArray
            });

            setSuccess('Doctor availability updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to update availability');
        } finally {
            setLoading(false);
        }
    };

    const applyToAll = () => {
        const template = schedule[1]; // Use Monday as template
        const newSchedule = {};
        for (let i = 0; i <= 6; i++) {
            newSchedule[i] = {
                ...template,
                enabled: schedule[i].enabled
            };
        }
        setSchedule(newSchedule);
    };

    return (
        <div className="doctor-availability-container">
            <h1>Doctor Availability Management</h1>
            <p className="subtitle">Set weekly schedules, slot durations, and capacity for doctors</p>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <div className="card mb-lg">
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
                                {doctor.hasSchedule && ' ✓ (Scheduled)'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedDoctor && (
                <form onSubmit={handleSaveSchedule}>
                    <div className="card mb-lg">
                        <div className="flex justify-between items-center mb-md">
                            <h3>Weekly Schedule</h3>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={applyToAll}>
                                Apply Monday to All Days
                            </button>
                        </div>

                        <div className="schedule-grid">
                            {daysOfWeek.map(day => (
                                <div key={day.value} className={`schedule-day ${schedule[day.value].enabled ? 'enabled' : 'disabled'}`}>
                                    <div className="day-header">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={schedule[day.value].enabled}
                                                onChange={() => handleDayToggle(day.value)}
                                            />
                                            <span className="day-name">{day.name}</span>
                                        </label>
                                    </div>

                                    {schedule[day.value].enabled && (
                                        <div className="day-config">
                                            <div className="time-inputs">
                                                <div className="input-group-inline">
                                                    <label>Start</label>
                                                    <input
                                                        type="time"
                                                        value={schedule[day.value].startTime}
                                                        onChange={(e) => handleTimeChange(day.value, 'startTime', e.target.value)}
                                                        className="input-sm"
                                                        required
                                                    />
                                                </div>
                                                <div className="input-group-inline">
                                                    <label>End</label>
                                                    <input
                                                        type="time"
                                                        value={schedule[day.value].endTime}
                                                        onChange={(e) => handleTimeChange(day.value, 'endTime', e.target.value)}
                                                        className="input-sm"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="config-inputs">
                                                <div className="input-group-inline">
                                                    <label>Slot Duration</label>
                                                    <select
                                                        value={schedule[day.value].slotDuration}
                                                        onChange={(e) => handleTimeChange(day.value, 'slotDuration', e.target.value)}
                                                        className="input-sm"
                                                    >
                                                        <option value="15">15 min</option>
                                                        <option value="20">20 min</option>
                                                        <option value="30">30 min</option>
                                                        <option value="45">45 min</option>
                                                        <option value="60">60 min</option>
                                                    </select>
                                                </div>
                                                <div className="input-group-inline">
                                                    <label>Max Patients</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="5"
                                                        value={schedule[day.value].maxPatientsPerSlot}
                                                        onChange={(e) => handleTimeChange(day.value, 'maxPatientsPerSlot', e.target.value)}
                                                        className="input-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Schedule'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default DoctorAvailability;
