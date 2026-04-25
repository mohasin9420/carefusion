import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './RoleAuth.css';

const RoleAuth = () => {
    const { role } = useParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        mobile: '',
        age: '',
        gender: '',
        specialization: '',
        qualification: '',
        department: '',
        experience: '',
        roleType: '',
        shiftTime: '',
        licenseNumber: '',
        shiftTiming: '',
        labType: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const roleConfig = {
        patient: { title: 'Patient', icon: '👨‍⚕️', color: '#4CAF50' },
        doctor: { title: 'Doctor', icon: '⚕️', color: '#2196F3' },
        staff: { title: 'Staff', icon: '👥', color: '#FF9800' },
        pharmacy: { title: 'Pharmacy', icon: '💊', color: '#9C27B0' },
        laboratory: { title: 'Laboratory', icon: '🔬', color: '#00BCD4' },
        admin: { title: 'Admin', icon: '🔐', color: '#F44336' },
    };

    const config = roleConfig[role] || roleConfig.patient;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(formData.email, formData.password);

            if (user.role !== role) {
                setError(`This login is for ${config.title} only. Your role is: ${user.role}`);
                setLoading(false);
                return;
            }

            // Redirect based on role
            navigate(`/${user.role}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            let profileData = {};

            if (role === 'patient') {
                profileData = {
                    fullName: formData.fullName,
                    mobile: formData.mobile,
                    age: formData.age ? parseInt(formData.age) : undefined,
                    gender: formData.gender,
                };
            } else if (role === 'doctor') {
                profileData = {
                    fullName: formData.fullName,
                    contactNumber: formData.mobile,
                    specialization: formData.specialization,
                    qualification: formData.qualification,
                    department: formData.department,
                    experience: formData.experience ? parseInt(formData.experience) : 0,
                };
            } else if (role === 'staff') {
                profileData = {
                    name: formData.fullName,
                    contactNumber: formData.mobile,
                    department: formData.department,
                    roleType: formData.roleType,
                    shiftTime: formData.shiftTime,
                };
            } else if (role === 'pharmacy') {
                profileData = {
                    pharmacistName: formData.fullName,
                    contactNumber: formData.mobile,
                    licenseNumber: formData.licenseNumber,
                    shiftTiming: formData.shiftTiming,
                };
            } else if (role === 'laboratory') {
                profileData = {
                    name: formData.fullName,
                    contactNumber: formData.mobile,
                    labType: formData.labType,
                };
            }

            const response = await authAPI.register({
                email: formData.email,
                password: formData.password,
                role,
                profileData,
            });

            setSuccess(response.data.message);
            setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                fullName: '',
                mobile: '',
                age: '',
                gender: '',
                specialization: '',
                qualification: '',
                department: '',
                experience: '',
                roleType: '',
                shiftTime: '',
                licenseNumber: '',
                shiftTiming: '',
                labType: '',
            });

            // Auto-switch to login mode for patients since they're approved immediately
            if (role === 'patient') {
                setTimeout(() => {
                    setMode('login');
                    setSuccess('');
                }, 2000); // Show success message for 2 seconds then switch to login
            }
        } catch (err) {
            console.error('Registration error:', err);
            console.error('Error response:', err.response);
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="role-auth-container">
            <div className="role-auth-card">
                <button className="back-btn" onClick={() => navigate('/')}>← Back</button>

                <div className="role-header" style={{ borderColor: config.color }}>
                    <span className="role-icon" style={{ color: config.color }}>{config.icon}</span>
                    <h2>{config.title} Portal</h2>
                </div>

                {role !== 'admin' && (
                    <div className="auth-tabs">
                        <button
                            className={`tab ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                            style={{ borderColor: mode === 'login' ? config.color : 'transparent' }}
                        >
                            Login
                        </button>
                        <button
                            className={`tab ${mode === 'register' ? 'active' : ''}`}
                            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                            style={{ borderColor: mode === 'register' ? config.color : 'transparent' }}
                        >
                            Register
                        </button>
                    </div>
                )}

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {mode === 'login' ? (
                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="input-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading}
                            style={{ backgroundColor: config.color }}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>

                        <p className="forgot-password">
                            <a href="/forgot-password">Forgot Password?</a>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="auth-form">
                        <div className="input-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Mobile Number</label>
                            <input
                                type="tel"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                required
                            />
                        </div>

                        {role === 'patient' && (
                            <>
                                <div className="input-group">
                                    <label>Age</label>
                                    <input
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Gender</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {role === 'doctor' && (
                            <>
                                <div className="input-group">
                                    <label>Specialization *</label>
                                    <input
                                        type="text"
                                        value={formData.specialization}
                                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Qualification *</label>
                                    <input
                                        type="text"
                                        value={formData.qualification}
                                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Department *</label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Experience (years) *</label>
                                    <input
                                        type="number"
                                        value={formData.experience}
                                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                        required
                                        min="0"
                                    />
                                </div>
                            </>
                        )}

                        {role === 'staff' && (
                            <>
                                <div className="input-group">
                                    <label>Department *</label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Role Type *</label>
                                    <select
                                        value={formData.roleType}
                                        onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Role Type</option>
                                        <option value="Reception">Reception</option>
                                        <option value="Support">Support</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Shift Time *</label>
                                    <select
                                        value={formData.shiftTime}
                                        onChange={(e) => setFormData({ ...formData, shiftTime: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Shift</option>
                                        <option value="Morning">Morning</option>
                                        <option value="Evening">Evening</option>
                                        <option value="Night">Night</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {role === 'pharmacy' && (
                            <>
                                <div className="input-group">
                                    <label>License Number *</label>
                                    <input
                                        type="text"
                                        value={formData.licenseNumber}
                                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Shift Timing *</label>
                                    <input
                                        type="text"
                                        value={formData.shiftTiming}
                                        onChange={(e) => setFormData({ ...formData, shiftTiming: e.target.value })}
                                        placeholder="e.g., 9 AM - 5 PM"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {role === 'laboratory' && (
                            <>
                                <div className="input-group">
                                    <label>Lab Type *</label>
                                    <select
                                        value={formData.labType}
                                        onChange={(e) => setFormData({ ...formData, labType: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Lab Type</option>
                                        <option value="Pathology">Pathology</option>
                                        <option value="Radiology">Radiology</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading}
                            style={{ backgroundColor: config.color }}
                        >
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RoleAuth;
