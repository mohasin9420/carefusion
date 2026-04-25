import { Routes, Route, Link } from 'react-router-dom';
import Navbar from '../Shared/Navbar';
import Sidebar from '../Shared/Sidebar';
import UserProfileModal from './UserProfileModal';
import AdminEmailSettings from './AdminEmailSettings';
import AdminApiKeys from './AdminApiKeys';
import StaffAppointments from '../Staff/StaffAppointments';
import '../Patient/PatientDashboard.css';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const sidebarLinks = [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/pending', label: 'Pending Approvals' },
        { to: '/admin/create-user', label: 'Create User' },
        { to: '/admin/users', label: 'Manage Users' },
        { to: '/admin/analytics', label: 'Analytics' },
        { to: '/admin/email-settings', label: '📧 Email Settings' },
        { to: '/admin/api-keys', label: '🔑 API Keys' },
        { to: '/admin/payments', label: '💰 Payment Management' },
    ];

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="dashboard-admin">
            <Navbar onToggleSidebar={toggleSidebar} />
            <div className="dashboard-layout">
                <Sidebar 
                    links={sidebarLinks} 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)} 
                />
                <main className="dashboard-main">
                    <Routes>
                        <Route index element={<AdminHome />} />
                        <Route path="pending" element={<PendingUsers />} />
                        <Route path="create-user" element={<CreateUser />} />
                        <Route path="users" element={<ManageUsers />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="email-settings" element={<AdminEmailSettings />} />
                        <Route path="api-keys" element={<AdminApiKeys />} />
                        <Route path="payments" element={<StaffAppointments initialTab="payments" />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const AdminHome = () => {
    const [analytics, setAnalytics] = useState(null);
    const [userCounts, setUserCounts] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            adminAPI.getAnalytics(),
            adminAPI.getPendingUsers(),
            adminAPI.getUserCounts()
        ])
            .then(([analyticsRes, pendingRes, countsRes]) => {
                setAnalytics(analyticsRes.data);
                setPendingCount(pendingRes.data.length);
                setUserCounts(countsRes.data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="spinner"></div>;

    const navTiles = [
        { title: 'Create Identity', sub: 'Provision new account', icon: '👤', to: '/admin/create-user', color: '#6366f1' },
        { title: 'Identity Registry', sub: 'Manage user credentials', icon: '📇', to: '/admin/users', color: '#0ea5e9' },
        { title: 'Payment Audit', sub: 'Verify transactions', icon: '💰', to: '/admin/payments', color: '#10b981' },
        { title: 'Mail Matrix', sub: 'SMTP configuration', icon: '📧', to: '/admin/email-settings', color: '#f59e0b' },
        { title: 'API Vault', sub: 'Cloud & AI keys', icon: '🔑', to: '/admin/api-keys', color: '#8b5cf6' },
        { title: 'Data Insights', sub: 'System analytics', icon: '📈', to: '/admin/analytics', color: '#ec4899' },
    ];

    return (
        <div className="admin-home-view">
            <div className="flex justify-between items-end mb-xl animate-fade">
                <div>
                    <h1 className="m-0 text-4xl font-black tracking-tight">System Architect Node</h1>
                    <p className="text-slate-500 font-medium tracking-wide uppercase text-xs mt-2">Global Infrastructure & Identity Registry Access</p>
                </div>
                <div className="flex items-center gap-4 glass-surface px-6 py-3 rounded-2xl">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Core Status: Optimal</span>
                </div>
            </div>

            {pendingCount > 0 && (
                <div className="m-badge m-badge-yellow w-full py-4 mb-xl flex justify-between items-center px-6 shadow-sm border border-yellow-200">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <span className="font-black text-yellow-900 uppercase">Critical Action: {pendingCount} Pending Identity Approval{pendingCount > 1 ? 's' : ''} Detected</span>
                    </div>
                    <a href="/admin/pending" className="btn btn-sm btn-white text-yellow-700 font-black shadow-lg" style={{ borderRadius: '10px' }}>
                        LAUNCH APPROVAL GATE
                    </a>
                </div>
            )}

            <div className="mb-2xl">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-lg">Access Terminals</h2>
                <div className="action-tile-grid">
                    {navTiles.map((tile, i) => (
                        <a key={i} href={tile.to} className="action-tile group border border-gray-100/50">
                            <div className="tile-icon" style={{ background: `${tile.color}15`, color: tile.color }}>{tile.icon}</div>
                            <div className="tile-info">
                                <h3>{tile.title}</h3>
                                <p>{tile.sub}</p>
                            </div>
                            <div className="tile-arrow">→</div>
                        </a>
                    ))}
                </div>
            </div>

            <div className="mb-2xl">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-lg flex items-center gap-2">
                    <span className="w-8 h-px bg-slate-200"></span> Population Census
                </h2>
                <div className="grid grid-4">
                    {[
                        { label: 'Patients', count: userCounts?.patient?.total, icon: '🏥', color: '#10b981' },
                        { label: 'Doctors', count: userCounts?.doctor?.total, pending: userCounts?.doctor?.pending, icon: '👨‍⚕️', color: '#6366f1' },
                        { label: 'Clinical Staff', count: userCounts?.staff?.total, pending: userCounts?.staff?.pending, icon: '🤝', color: '#0ea5e9' },
                        { label: 'Pharmacy', count: userCounts?.pharmacy?.total, pending: userCounts?.pharmacy?.pending, icon: '💊', color: '#f59e0b' },
                    ].map((stat, i) => (
                        <div key={i} className="modern-stat-card glass-surface" style={{ '--role-accent': stat.color, '--role-light': `${stat.color}15` }}>
                            <div className="stat-icon-wrapper" style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
                            <div className="stat-info">
                                <h3>{stat.label}</h3>
                                <div className="stat-value">{stat.count || 0}</div>
                                {stat.pending > 0 && (
                                    <span className="badge badge-warning" style={{ fontSize: '10px', marginTop: '4px', display: 'inline-block' }}>
                                        {stat.pending} QUEUED
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-2xl">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-lg">Throughput Metrics</h2>
                <div className="modern-stat-grid">
                    <div className="modern-stat-card bg-slate-900 text-white shadow-xl">
                        <div className="stat-icon-wrapper" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>📅</div>
                        <div className="stat-info">
                            <h3 className="text-slate-400">Today's Appointments</h3>
                            <div className="stat-value text-white">{analytics?.todayAppointments || 0}</div>
                        </div>
                    </div>
                    <div className="modern-stat-card border border-gray-100">
                        <div className="stat-icon-wrapper" style={{ background: '#f8fafc', color: '#475569' }}>🧾</div>
                        <div className="stat-info">
                            <h3 className="text-gray-400">Lifetime Transactions</h3>
                            <div className="stat-value">{analytics?.totalAppointments || 0}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PendingUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        adminAPI.getPendingUsers()
            .then(res => setUsers(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleApproval = async (userId, status) => {
        if (status === 'rejected' && !window.confirm('Are you sure you want to REJECT this identity?')) return;
        setActionLoading(userId);
        try {
            await adminAPI.approveUser(userId, status);
            setUsers(users.filter(u => u._id !== userId));
        } catch (error) {
            console.error(error);
            alert('Failed to update user status');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="pending-approvals-view">
             <div className="flex justify-between items-center mb-xl">
                <div>
                    <h1 className="m-0 text-3xl font-black text-gray-900">Identity Guard</h1>
                    <p className="text-gray-500 font-medium">Screen and authenticate new portal participants.</p>
                </div>
                <div className="m-badge m-badge-blue">{users.length} Awaiting Verification</div>
            </div>

            {users.length === 0 ? (
                <div className="py-2xl text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="text-5xl mb-md">🛡️</div>
                    <p className="text-gray-400 font-black">All identities are verified. The guard is clear.</p>
                </div>
            ) : (
                <div className="medical-ledger-container shadow-xl" style={{ borderRadius: '24px' }}>
                    <div className="table-responsive">
                        <table className="medical-ledger-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '2rem' }}>Identity Signature</th>
                                    <th>Requested Authority</th>
                                    <th>Registration Timestamp</th>
                                    <th className="text-center" style={{ paddingRight: '2rem' }}>Credential Control</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td style={{ paddingLeft: '2rem' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">👤</div>
                                                <div>
                                                    <div className="font-black text-gray-900">{user.email}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase">ID: {user._id.slice(-12)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="m-badge m-badge-indigo uppercase">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="text-xs font-bold text-gray-400">
                                                {new Date(user.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td style={{ paddingRight: '2rem' }}>
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleApproval(user._id, 'approved')}
                                                    className="btn btn-sm btn-success px-6 shadow-md"
                                                    disabled={actionLoading === user._id}
                                                    style={{ borderRadius: '10px' }}
                                                >
                                                    {actionLoading === user._id ? 'Processing...' : 'GRANT ACCESS'}
                                                </button>
                                                <button
                                                    onClick={() => handleApproval(user._id, 'rejected')}
                                                    className="btn btn-sm btn-outline-danger px-6"
                                                    disabled={actionLoading === user._id}
                                                    style={{ borderRadius: '10px' }}
                                                >
                                                    {actionLoading === user._id ? '...' : 'REJECT'}
                                                </button>
                                            </div>
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

const CreateUser = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'patient',
        profileData: {}
    });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Build profile data based on role
            const profileData = {
                fullName: formData.fullName,
                contactNumber: formData.contactNumber,
                ...(formData.role === 'patient' && {
                    age: formData.age,
                    gender: formData.gender,
                    mobile: formData.contactNumber,
                    address: formData.address,
                }),
                ...(formData.role === 'doctor' && {
                    specialization: formData.specialization,
                    department: formData.department,
                    qualification: formData.qualification,
                    experience: formData.experience,
                    consultationFee: formData.consultationFee,
                    upiId: formData.upiId,
                }),
                ...(formData.role === 'staff' && {
                    name: formData.fullName,
                    roleType: formData.roleType,
                    department: formData.department,
                    shiftTime: formData.shiftTime,
                }),
                ...(formData.role === 'pharmacy' && {
                    pharmacistName: formData.fullName,
                    contactNumber: formData.contactNumber,
                    licenseNumber: formData.licenseNumber,
                    shiftTiming: formData.shiftTiming,
                }),
                ...(formData.role === 'laboratory' && {
                    name: formData.fullName,
                    labType: formData.labType,
                }),
            };

            await adminAPI.createUser({
                email: formData.email,
                password: formData.password,
                role: formData.role,
                profileData
            });

            setMessage('Identity provisioned successfully!');
            setFormData({ email: '', password: '', role: 'patient', profileData: {} });
        } catch (error) {
            setMessage(error.response?.data?.message || 'Identity provisioning failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-user-view max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-xl">
                <div>
                    <h1 className="m-0 text-3xl font-black text-gray-900">Provision Identity</h1>
                    <p className="text-gray-500 font-medium">Create and authenticate a new system participant.</p>
                </div>
            </div>

            {message && (
                <div className={`m-badge ${message.includes('success') ? 'm-badge-green' : 'm-badge-red'} w-full py-4 text-center mb-xl shadow-sm`}>
                    {message.toUpperCase()}
                </div>
            )}

            <div className="medical-ledger-container shadow-2xl p-xl bg-white" style={{ borderRadius: '32px' }}>
                <form onSubmit={handleSubmit} className="space-y-xl">
                    <div className="grid grid-2 gap-xl">
                        <section className="space-y-lg">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Core Credentials</h3>
                            
                            <div className="input-group">
                                <label className="input-label">System Email</label>
                                <input
                                    type="email"
                                    className="input h-12"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="e.g. user@hospital.com"
                                    required
                                    style={{ borderRadius: '14px' }}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Access Password</label>
                                <input
                                    type="password"
                                    className="input h-12"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    style={{ borderRadius: '14px' }}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Authorized Role</label>
                                <select
                                    className="input h-12 font-black"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    required
                                    style={{ borderRadius: '14px' }}
                                >
                                    <option value="patient">Patient Gate</option>
                                    <option value="doctor">Medical Practitioner</option>
                                    <option value="staff">Clinical Support</option>
                                    <option value="pharmacy">Pharmaceutical Unit</option>
                                    <option value="laboratory">Diagnostic Unit</option>
                                    <option value="admin">System Architect</option>
                                </select>
                            </div>
                        </section>

                        <section className="space-y-lg">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Primary Profile</h3>
                            
                            <div className="input-group">
                                <label className="input-label">Legal Full Name</label>
                                <input
                                    type="text"
                                    className="input h-12"
                                    value={formData.fullName || ''}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="Enter full legal name"
                                    required
                                    style={{ borderRadius: '14px' }}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Primary Contact</label>
                                <input
                                    type="tel"
                                    className="input h-12"
                                    value={formData.contactNumber || ''}
                                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                    placeholder="+91 XXXXX XXXXX"
                                    required
                                    style={{ borderRadius: '14px' }}
                                />
                            </div>
                        </section>
                    </div>

                    <div className="bg-gray-50/50 p-xl rounded-3xl border border-gray-100">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-lg flex items-center gap-2">
                             <span>🛡️</span> ROLE-SPECIFIC MANDATORY METADATA
                        </h3>
                        
                        <div className="grid grid-2 gap-xl">
                            {formData.role === 'patient' && (
                                <>
                                    <div className="input-group">
                                        <label className="input-label">Biological Age</label>
                                        <input
                                            type="number"
                                            className="input h-12"
                                            value={formData.age || ''}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            style={{ borderRadius: '12px' }}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Gender</label>
                                        <select
                                            className="input h-12"
                                            value={formData.gender || ''}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            style={{ borderRadius: '12px' }}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="input-group col-span-2">
                                        <label className="input-label">Residential Landmark</label>
                                        <textarea
                                            className="input"
                                            value={formData.address || ''}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            style={{ height: '80px', borderRadius: '12px' }}
                                        />
                                    </div>
                                </>
                            )}

                            {formData.role === 'doctor' && (
                                <>
                                    <div className="input-group">
                                        <label className="input-label">Clinical Specialization</label>
                                        <input
                                            type="text"
                                            className="input h-12"
                                            value={formData.specialization || ''}
                                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                            required
                                            style={{ borderRadius: '12px' }}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Assigned Department</label>
                                        <input
                                            type="text"
                                            className="input h-12"
                                            value={formData.department || ''}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            required
                                            style={{ borderRadius: '12px' }}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Experience Ledger (Years)</label>
                                        <input
                                            type="number"
                                            className="input h-12"
                                            value={formData.experience || ''}
                                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                            required
                                            min="0"
                                            style={{ borderRadius: '12px' }}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Consultation Yield (₹)</label>
                                        <input
                                            type="number"
                                            className="input h-12 font-black text-emerald-600"
                                            value={formData.consultationFee || 500}
                                            onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                                            required
                                            min="0"
                                            style={{ borderRadius: '12px' }}
                                        />
                                    </div>
                                </>
                            )}

                            {formData.role === 'staff' && (
                                <>
                                    <div className="input-group">
                                        <label className="input-label">Assigned Department</label>
                                        <input
                                            type="text"
                                            className="input h-12"
                                            value={formData.department || ''}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            required
                                            style={{ borderRadius: '12px' }}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Unit Role Profile</label>
                                        <select
                                            className="input h-12"
                                            value={formData.roleType || ''}
                                            onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                                            required
                                            style={{ borderRadius: '12px' }}
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Reception">Front-Desk Operation</option>
                                            <option value="Support">Clinical Support</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {(formData.role === 'pharmacy' || formData.role === 'laboratory') && (
                                <div className="input-group col-span-2">
                                     <label className="input-label">Unit Operational Identifier (License/Type)</label>
                                     <input
                                        type="text"
                                        className="input h-12"
                                        value={formData.licenseNumber || formData.labType || ''}
                                        onChange={(e) => formData.role === 'pharmacy' ? setFormData({ ...formData, licenseNumber: e.target.value }) : setFormData({ ...formData, labType: e.target.value })}
                                        required
                                        style={{ borderRadius: '12px' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full h-14 shadow-2xl flex items-center justify-center gap-2 group overflow-hidden" disabled={loading} style={{ borderRadius: '20px' }}>
                        {loading ? <div className="spinner-sm border-white"></div> : (
                            <>
                                <span className="font-black text-lg">PROVISION ACCESS IDENTITY</span>
                                <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

const ManageUsers = () => {
    const [role, setRole] = useState('patient');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchUsers = () => {
        setLoading(true);
        adminAPI.getUsersByRole(role)
            .then(res => setUsers(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsers();
    }, [role]);

    const handleViewProfile = async (userId) => {
        try {
            setActionLoading(userId);
            const res = await adminAPI.getUserDetails(userId);
            setSelectedUser(res.data);
            setShowProfileModal(true);
        } catch (error) {
            console.error(error);
            alert('Failed to load user details');
        } finally {
            setActionLoading(null);
        }
    };

    const handleBlockUser = async (user) => {
        const action = user.status === 'blocked' ? 'unblock' : 'block';
        if (!window.confirm(`Are you sure you want to ${action.toUpperCase()} this user?`)) return;

        try {
            setActionLoading(user._id);
            await adminAPI.blockUser(user._id);
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert(`Failed to ${action} user`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('CRITICAL: Permanent deletion of identity. This action cannot be undone. Proceed?')) return;

        try {
            setActionLoading(userId);
            await adminAPI.deleteUser(userId);
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    const statusBadgeClass = (status) => {
        if (status === 'approved') return 'm-badge-green';
        if (status === 'blocked') return 'm-badge-red';
        return 'm-badge-yellow';
    };

    return (
        <div className="manage-users-view">
            <div className="flex justify-between items-center mb-xl">
                <div>
                    <h1 className="m-0 text-3xl font-black text-gray-900">Identity Registry</h1>
                    <p className="text-gray-500 font-medium">Global ledger of provisioned system participants.</p>
                </div>
                <div className="flex gap-md items-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Global Filter:</span>
                    <select className="input shadow-sm" value={role} onChange={(e) => setRole(e.target.value)} style={{ width: 'auto', minWidth: '200px', borderRadius: '12px' }}>
                        <option value="patient">Patient Population</option>
                        <option value="doctor">Medical Practitioners</option>
                        <option value="staff">Clinical Support</option>
                        <option value="pharmacy">Pharmaceutical Unit</option>
                        <option value="laboratory">Diagnostic Unit</option>
                    </select>
                </div>
            </div>

            {loading ? <div className="spinner-sm mx-auto"></div> : (
                <div className="medical-ledger-container shadow-xl" style={{ borderRadius: '24px' }}>
                    <div className="medical-ledger-header border-none bg-gray-50/50">
                        <h3>Personnel Ledger</h3>
                        <div className="m-badge m-badge-blue">{users.length} Provisioned Identities</div>
                    </div>
                    {users.length === 0 ? (
                         <div className="py-2xl text-center">
                            <div className="text-5xl mb-md">📇</div>
                            <p className="text-gray-400 font-medium">The registry is empty for this role filter.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="medical-ledger-table">
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: '2rem' }}>Identity Signature</th>
                                        <th>Legal Name</th>
                                        <th>Status</th>
                                        <th>Onboarding Timestamp</th>
                                        <th className="text-center" style={{ paddingRight: '2rem' }}>Registry Control</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id}>
                                            <td style={{ paddingLeft: '2rem' }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">👤</div>
                                                    <div>
                                                        <div className="font-black text-gray-900 text-sm">{user.email}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase">ID: {user._id.slice(-12)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="font-bold text-gray-800">{user.profile?.fullName || user.profile?.name || user.profile?.pharmacistName || 'N/A'}</div>
                                            </td>
                                            <td>
                                                <span className={`m-badge ${statusBadgeClass(user.status)}`}>
                                                    {user.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="text-xs font-bold text-gray-400">
                                                    {new Date(user.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td style={{ paddingRight: '2rem' }}>
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewProfile(user._id)}
                                                        className="btn btn-sm btn-info px-4 shadow-sm"
                                                        disabled={actionLoading === user._id}
                                                        style={{ borderRadius: '10px' }}
                                                    >
                                                        {actionLoading === user._id ? '...' : 'PROFILE'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleBlockUser(user)}
                                                        className={`btn btn-sm ${user.status === 'blocked' ? 'btn-success' : 'btn-warning'} px-4 shadow-sm`}
                                                        disabled={actionLoading === user._id}
                                                        style={{ borderRadius: '10px' }}
                                                    >
                                                        {actionLoading === user._id ? '...' : user.status === 'blocked' ? 'UNBLOCK' : 'LOCK'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                                                        disabled={actionLoading === user._id}
                                                    >
                                                        {actionLoading === user._id ? '...' : '🗑️'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {showProfileModal && selectedUser && (
                <UserProfileModal
                    user={selectedUser.user}
                    profile={selectedUser.profile}
                    onClose={() => {
                        setShowProfileModal(false);
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
};

const Analytics = () => {
    return (
        <div>
            <h1 className="mb-lg">Analytics</h1>
            <div className="card">
                <p className="text-gray-500">Detailed analytics and reports will be displayed here.</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
