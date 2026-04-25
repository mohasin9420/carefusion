import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '', role: 'patient' });
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const roles = [
        { value: 'patient',    label: 'Patient',    icon: '🏥', desc: 'Book appointments & track health' },
        { value: 'doctor',     label: 'Doctor',     icon: '⚕️', desc: 'Manage patients & consultations' },
        { value: 'staff',      label: 'Staff',      icon: '👥', desc: 'Reception & support operations' },
        { value: 'pharmacy',   label: 'Pharmacy',   icon: '💊', desc: 'Prescriptions & inventory' },
        { value: 'laboratory', label: 'Laboratory', icon: '🔬', desc: 'Tests & diagnostic reports' },
        { value: 'admin',      label: 'Admin',      icon: '🔐', desc: 'System administration' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setErrorType('');
        setLoading(true);

        try {
            const user = await login(formData.email, formData.password);
            if (user.role !== formData.role) {
                setError(`This account is registered as "${user.role}", not "${formData.role}". Please select the correct role.`);
                setLoading(false);
                return;
            }
            navigate(`/${user.role}`);
        } catch (err) {
            const code = err.response?.data?.code;
            const msg = err.response?.data?.message;
            if (code === 'PENDING') {
                setErrorType('pending');
                setError('Your account is pending admin approval. Please wait or contact admin.');
            } else if (code === 'REJECTED') {
                setErrorType('rejected');
                setError('Your registration was rejected. Please contact admin for assistance.');
            } else if (code === 'BLOCKED') {
                setErrorType('blocked');
                setError('Your account has been blocked. Please contact the system administrator.');
            } else {
                setErrorType('');
                setError(msg || 'Invalid email or password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const selectedRole = roles.find(r => r.value === formData.role);

    return (
        <div className="auth-page">
            {/* Animated Background */}
            <div className="auth-bg">
                <div className="auth-blob auth-blob-1"></div>
                <div className="auth-blob auth-blob-2"></div>
                <div className="auth-blob auth-blob-3"></div>
                <div className="auth-grid-overlay"></div>
            </div>

            <div className="auth-wrapper">
                {/* Left Panel — Branding */}
                <div className="auth-brand-panel">
                    <Link to="/" className="auth-brand-logo">
                        <div className="auth-logo-icon">⚕️</div>
                        <div>
                            <div className="auth-logo-name">CareFusion</div>
                            <div className="auth-logo-sub">Hospital Management System</div>
                        </div>
                    </Link>
                    <div className="auth-brand-content">
                        <h2 className="auth-brand-title">Welcome Back to<br /><span className="auth-brand-highlight">CareFusion</span></h2>
                        <p className="auth-brand-desc">Your secure gateway to a unified hospital management experience. Access patient records, appointments, and clinical workflows in one place.</p>
                        <div className="auth-brand-features">
                            <div className="auth-feature-item">
                                <span className="auth-feature-icon">🔒</span>
                                <span>Enterprise-grade security</span>
                            </div>
                            <div className="auth-feature-item">
                                <span className="auth-feature-icon">⚡</span>
                                <span>Real-time clinical data</span>
                            </div>
                            <div className="auth-feature-item">
                                <span className="auth-feature-icon">📊</span>
                                <span>Comprehensive analytics</span>
                            </div>
                        </div>
                    </div>
                    <div className="auth-brand-footer">
                        <div className="auth-stat"><span className="auth-stat-num">500+</span><span>Patients</span></div>
                        <div className="auth-stat-div"></div>
                        <div className="auth-stat"><span className="auth-stat-num">50+</span><span>Doctors</span></div>
                        <div className="auth-stat-div"></div>
                        <div className="auth-stat"><span className="auth-stat-num">24/7</span><span>Operations</span></div>
                    </div>
                </div>

                {/* Right Panel — Form */}
                <div className="auth-form-panel">
                    <div className="auth-form-card">
                        <div className="auth-form-header">
                            <h1 className="auth-form-title">Sign In</h1>
                            <p className="auth-form-subtitle">Select your role and enter your credentials</p>
                        </div>

                        {/* Role Selector Grid */}
                        <div className="auth-role-grid">
                            {roles.map(role => (
                                <button
                                    key={role.value}
                                    type="button"
                                    className={`auth-role-btn ${formData.role === role.value ? 'auth-role-btn--active' : ''}`}
                                    onClick={() => setFormData({ ...formData, role: role.value })}
                                >
                                    <span className="auth-role-icon">{role.icon}</span>
                                    <span className="auth-role-label">{role.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Role Info Badge */}
                        {selectedRole && (
                            <div className="auth-role-badge">
                                <span>{selectedRole.icon}</span>
                                <span>{selectedRole.desc}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-login-form">
                            {/* Email */}
                            <div className="auth-field">
                                <label className="auth-label">Email Address</label>
                                <div className="auth-input-wrap">
                                    <span className="auth-input-icon">✉️</span>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="Enter your email address"
                                        className="auth-input"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="auth-field">
                                <label className="auth-label">Password</label>
                                <div className="auth-input-wrap">
                                    <span className="auth-input-icon">🔑</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Enter your password"
                                        className="auth-input"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="auth-eye-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className={`auth-alert auth-alert--error auth-alert--${errorType || 'default'}`}>
                                    <span className="auth-alert-icon">
                                        {errorType === 'pending' ? '⏳' : errorType === 'blocked' ? '🚫' : errorType === 'rejected' ? '❌' : '⚠️'}
                                    </span>
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Submit */}
                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading ? (
                                    <><span className="auth-spinner"></span> Authenticating...</>
                                ) : (
                                    <>Sign In to {selectedRole?.label} Portal <span>→</span></>
                                )}
                            </button>
                        </form>

                        <div className="auth-form-footer">
                            <span>Don't have an account?</span>
                            <Link to="/register" className="auth-footer-link">Create Account</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
