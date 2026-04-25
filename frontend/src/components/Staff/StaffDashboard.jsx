import { Routes, Route, Link } from 'react-router-dom';
import Navbar from '../Shared/Navbar';
import Sidebar from '../Shared/Sidebar';
import '../Patient/PatientDashboard.css';
import { useState, useEffect } from 'react';
import { staffAPI } from '../../services/api';
import DoctorAvailability from './DoctorAvailability';
import BlockSlots from './BlockSlots';
import StaffAppointments from './StaffAppointments';
import StaffInsuranceClaims from './StaffInsuranceClaims';

const StaffDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const sidebarLinks = [
        { to: '/staff', label: 'Dashboard' },
        { to: '/staff/doctor-availability', label: 'Doctor Availability' },
        { to: '/staff/block-slots', label: 'Block Slots' },
        { to: '/staff/queue', label: 'Daily Queue' },
        { to: '/staff/appointments', label: 'Appointments' },
        { to: '/staff/payments', label: '💰 Payment Management' },
        { to: '/staff/insurance', label: '🏥 Insurance Claims' },
    ];

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="dashboard-layout-wrapper">
            <Navbar onToggleSidebar={toggleSidebar} />
            <div className="dashboard-layout">
                <Sidebar 
                    links={sidebarLinks} 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)} 
                />
                <main className="dashboard-main">
                    <Routes>
                        <Route index element={<StaffHome />} />
                        <Route path="doctor-availability" element={<DoctorAvailability />} />
                        <Route path="block-slots" element={<BlockSlots />} />
                        <Route path="queue" element={<DailyQueue />} />
                        <Route path="appointments" element={<StaffAppointments />} />
                        <Route path="payments" element={<StaffAppointments initialTab="payments" />} />
                        <Route path="insurance" element={<StaffInsuranceClaims />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const StaffHome = () => {
    return (
        <div className="staff-home-container">
            <div className="flex justify-between items-end mb-xl animate-fade">
                <div>
                    <h1 className="m-0 text-4xl">Hospital Command Center</h1>
                    <p className="text-slate-500 font-medium">Internal Administration & Reception Management Protocol</p>
                </div>
                <div className="glass-surface px-6 py-3 rounded-2xl text-right">
                    <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Operational Date</div>
                    <div className="text-primary font-black">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            <div className="action-tile-grid">
                <Link to="/staff/queue" className="action-tile">
                    <span className="tile-icon">🏷️</span>
                    <h3>Daily Queue</h3>
                    <p>Direct walk-in registration and live OPD queue tracking.</p>
                </Link>

                <Link to="/staff/appointments" className="action-tile">
                    <span className="tile-icon">📆</span>
                    <h3>Appointments</h3>
                    <p>Manage digital bookings, rescheduling, and status tracking.</p>
                </Link>

                <Link to="/staff/payments" className="action-tile">
                    <span className="tile-icon">💳</span>
                    <h3>Payments</h3>
                    <p>Verify payment screenshots and manage consultation fees.</p>
                </Link>

                <Link to="/staff/insurance" className="action-tile">
                    <span className="tile-icon">🏥</span>
                    <h3>Insurance</h3>
                    <p>Process cashless claims and reimbursement documentation.</p>
                </Link>

                <Link to="/staff/doctor-availability" className="action-tile">
                    <span className="tile-icon">⏰</span>
                    <h3>Schedules</h3>
                    <p>Set doctor weekly availability and slot durations.</p>
                </Link>

                <Link to="/staff/block-slots" className="action-tile">
                    <span className="tile-icon">🚫</span>
                    <h3>Overnight Block</h3>
                    <p>Manage doctor leaves, emergencies and clinic closures.</p>
                </Link>
            </div>
        </div>
    );
};

const DailyQueue = () => {
    const [queue, setQueue] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            staffAPI.getDailyQueue(),
            staffAPI.getPatients(),
            staffAPI.getDoctors()
        ])
            .then(([queueRes, patientsRes, doctorsRes]) => {
                setQueue(queueRes.data);
                setPatients(patientsRes.data);
                setDoctors(doctorsRes.data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleAddToQueue = async (e) => {
        e.preventDefault();
        try {
            const res = await staffAPI.addToQueue({
                patientId: selectedPatient,
                doctorId: selectedDoctor
            });
            setQueue([...queue, res.data]);
            setSelectedPatient('');
            setSelectedDoctor('');
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="daily-queue-page">
            <h1 className="mb-lg">Daily OPD Queue Monitor</h1>

            <div className="card p-xl mb-xl" style={{ borderLeft: '4px solid #7c3aed' }}>
                <h3 className="mb-md">🚶 Walk-in Registration</h3>
                <form onSubmit={handleAddToQueue} className="grid grid-3 gap-md items-end">
                    <div className="form-group m-0">
                        <label className="profile-label">Select Patient</label>
                        <select
                            className="input"
                            value={selectedPatient}
                            onChange={(e) => setSelectedPatient(e.target.value)}
                            required
                        >
                            <option value="">-- Choose Patient --</option>
                            {patients.map(p => (
                                <option key={p._id} value={p._id}>{p.fullName} - {p.mobile}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group m-0">
                        <label className="profile-label">Assign Doctor (Optional)</label>
                        <select
                            className="input"
                            value={selectedDoctor}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                        >
                            <option value="">-- Auto Assign --</option>
                            {doctors.map(d => (
                                <option key={d._id} value={d._id}>{d.fullName} ({d.specialization})</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '45px' }}>⚡ Issue Token</button>
                </form>
            </div>

            <div className="medical-ledger-container">
                <div className="medical-ledger-header">
                    <h3>Live OPD Queue Ledger</h3>
                    <div className="m-badge m-badge-purple">Active Patients: {queue.length}</div>
                </div>
                <div className="table-responsive">
                    <table className="medical-ledger-table">
                        <thead>
                            <tr>
                                <th>Token</th>
                                <th>Patient Name</th>
                                <th>Consulting Doctor</th>
                                <th>Visit Status</th>
                                <th className="text-center">Operations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queue.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-xl text-gray-400">The queue is currently empty.</td></tr>
                            ) : (
                                queue.map((item) => (
                                    <tr key={item._id}>
                                        <td>
                                            <div className="text-lg font-bold text-indigo-600">#{item.tokenNumber}</div>
                                            <div className="text-xs text-gray-400">ISSUED TODAY</div>
                                        </td>
                                        <td>
                                            <div className="font-bold">{item.patientId?.fullName}</div>
                                            <div className="text-xs text-gray-500">{item.patientId?.mobile}</div>
                                        </td>
                                        <td>
                                            {item.doctorId ? (
                                                <div className="flex items-center gap-2">
                                                    <span>👨‍⚕️</span>
                                                    <div>
                                                        <div className="font-bold">Dr. {item.doctorId?.fullName}</div>
                                                        <div className="text-xs text-gray-400">{item.doctorId?.specialization}</div>
                                                    </div>
                                                </div>
                                            ) : <span className="text-gray-400 italic">Not Assigned</span>}
                                        </td>
                                        <td>
                                            <span className={`m-badge ${
                                                item.status === 'completed' ? 'm-badge-green' :
                                                item.status === 'in-progress' ? 'm-badge-yellow' : 'm-badge-blue'
                                            }`}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            {item.status === 'waiting' && (
                                                <button className="btn btn-sm btn-outline-primary">Process Next</button>
                                            )}
                                            {item.status === 'completed' && (
                                                <span className="text-green-600 font-bold text-sm">✓ Checked Out</span>
                                            ) }
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
