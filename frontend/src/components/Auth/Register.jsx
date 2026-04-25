import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Login.css';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 = role select, 2 = form
    const [formData, setFormData] = useState({
        role: '',
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
        labType: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be under 5MB.');
            return;
        }
        setProfileImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setError('');
    };

    const removeImage = () => {
        setProfileImageFile(null);
        setImagePreview(null);
    };

    const roles = [
        { value: 'patient',    label: 'Patient',    icon: '🏥', desc: 'Register as a patient to book appointments and manage your health records.' },
        { value: 'doctor',     label: 'Doctor',     icon: '⚕️', desc: 'Join as a doctor to manage consultations, prescriptions and patient care.' },
        { value: 'staff',      label: 'Staff',      icon: '👥', desc: 'Register as reception or support staff for hospital operations.' },
        { value: 'pharmacy',   label: 'Pharmacy',   icon: '💊', desc: 'Join as a pharmacist to manage prescriptions and medicine inventory.' },
        { value: 'laboratory', label: 'Laboratory', icon: '🔬', desc: 'Register as a lab technician for diagnostic test management.' },
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleSelect = (role) => {
        setFormData({ ...formData, role });
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match. Please re-enter.');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            let profileData = {};
            if (formData.role === 'patient') {
                profileData = { fullName: formData.fullName, mobile: formData.mobile, age: formData.age ? parseInt(formData.age) : undefined, gender: formData.gender };
            } else if (formData.role === 'doctor') {
                profileData = { fullName: formData.fullName, contactNumber: formData.mobile, specialization: formData.specialization, qualification: formData.qualification, department: formData.department, experience: formData.experience ? parseInt(formData.experience) : 0 };
            } else if (formData.role === 'staff') {
                profileData = { name: formData.fullName, contactNumber: formData.mobile, roleType: formData.roleType, department: formData.department || 'General', shiftTime: formData.shiftTime };
            } else if (formData.role === 'pharmacy') {
                profileData = { pharmacistName: formData.fullName, contactNumber: formData.mobile, licenseNumber: formData.licenseNumber, shiftTiming: formData.shiftTiming };
            } else if (formData.role === 'laboratory') {
                profileData = { name: formData.fullName, contactNumber: formData.mobile, labType: formData.labType };
            }

            const res = await authAPI.register(
                { email: formData.email, password: formData.password, role: formData.role, profileData },
                profileImageFile || null
            );
            setSuccess(res.data?.message || 'Registration successful!');
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
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

            <div className="auth-wrapper auth-wrapper--register">
                {/* Header Bar */}
                <div className="auth-reg-topbar">
                    <Link to="/" className="auth-reg-back">← Back to Home</Link>
                    <Link to="/" className="auth-brand-logo auth-reg-brand">
                        <div className="auth-logo-icon">⚕️</div>
                        <div>
                            <div className="auth-logo-name">CareFusion</div>
                        </div>
                    </Link>
                    <Link to="/login" className="auth-reg-login-link">Already have an account? <strong>Sign In</strong></Link>
                </div>

                {/* Step 1: Role Selection */}
                {step === 1 && (
                    <div className="auth-role-select-screen">
                        <div className="auth-role-select-header">
                            <h1 className="auth-form-title">Create Your Account</h1>
                            <p className="auth-form-subtitle">Select your role in the CareFusion system to get started</p>
                        </div>
                        <div className="auth-role-select-grid">
                            {roles.map(role => (
                                <button
                                    key={role.value}
                                    type="button"
                                    className="auth-role-card"
                                    onClick={() => handleRoleSelect(role.value)}
                                >
                                    <div className="auth-role-card-icon">{role.icon}</div>
                                    <div className="auth-role-card-name">{role.label}</div>
                                    <div className="auth-role-card-desc">{role.desc}</div>
                                    <div className="auth-role-card-cta">Register as {role.label} →</div>
                                </button>
                            ))}
                        </div>
                        <div className="auth-form-footer" style={{ marginTop: '2rem', justifyContent: 'center', display: 'flex', gap: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
                            <span>Already have an account?</span>
                            <Link to="/login" className="auth-footer-link">Sign In</Link>
                        </div>
                    </div>
                )}

                {/* Step 2: Registration Form */}
                {step === 2 && (
                    <div className="auth-reg-form-wrap">
                        <div className="auth-form-card auth-form-card--wide">
                            {/* Header */}
                            <div className="auth-reg-form-header">
                                <button type="button" className="auth-back-step" onClick={() => { setStep(1); setError(''); setSuccess(''); }}>
                                    ← Change Role
                                </button>
                                <div className="auth-reg-role-badge">
                                    <span>{selectedRole?.icon}</span>
                                    <span>{selectedRole?.label} Registration</span>
                                </div>
                            </div>
                            <h1 className="auth-form-title" style={{ marginBottom: '0.25rem' }}>Complete Your Profile</h1>
                            <p className="auth-form-subtitle" style={{ marginBottom: '2rem' }}>Fill in the details below to create your {selectedRole?.label} account</p>

                            <form onSubmit={handleSubmit} className="auth-reg-form">
                                {/* Account Credentials */}
                                <div className="auth-reg-section-label">Account Credentials</div>
                                <div className="auth-reg-row">
                                    <div className="auth-field">
                                        <label className="auth-label">Email Address *</label>
                                        <div className="auth-input-wrap">
                                            <span className="auth-input-icon">✉️</span>
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" className="auth-input" required autoComplete="email" />
                                        </div>
                                    </div>
                                </div>
                                <div className="auth-reg-row auth-reg-row--2">
                                    <div className="auth-field">
                                        <label className="auth-label">Password *</label>
                                        <div className="auth-input-wrap">
                                            <span className="auth-input-icon">🔑</span>
                                            <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters" className="auth-input" required />
                                            <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>{showPassword ? '🙈' : '👁️'}</button>
                                        </div>
                                    </div>
                                    <div className="auth-field">
                                        <label className="auth-label">Confirm Password *</label>
                                        <div className="auth-input-wrap">
                                            <span className="auth-input-icon">🔒</span>
                                            <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" className="auth-input" required />
                                        </div>
                                    </div>
                                </div>

                                {/* Role-Specific Fields */}
                                <div className="auth-reg-section-label" style={{ marginTop: '0.5rem' }}>{selectedRole?.label} Profile Information</div>

                                {/* Profile Image Upload — shown only for Patient & Doctor */}
                                {(formData.role === 'patient' || formData.role === 'doctor') && (
                                    <div className="auth-photo-upload">
                                        <div className="auth-photo-preview">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Profile preview" className="auth-photo-img" />
                                            ) : (
                                                <div className="auth-photo-placeholder">
                                                    <span style={{ fontSize: '2rem' }}>{formData.role === 'doctor' ? '👨‍⚕️' : '👤'}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="auth-photo-info">
                                            <div className="auth-photo-title">
                                                {formData.role === 'doctor' ? 'Doctor Profile Photo' : 'Patient Profile Photo'}
                                                <span className="auth-photo-optional"> (Optional)</span>
                                            </div>
                                            <div className="auth-photo-hint">JPG, PNG or WebP · Max 5MB · Square image recommended</div>
                                            <div className="auth-photo-actions">
                                                <label htmlFor="profilePictureInput" className="auth-photo-btn">
                                                    {imagePreview ? '🔄 Change Photo' : '📷 Upload Photo'}
                                                </label>
                                                <input
                                                    type="file"
                                                    id="profilePictureInput"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    onChange={handleImageChange}
                                                    style={{ display: 'none' }}
                                                />
                                                {imagePreview && (
                                                    <button type="button" className="auth-photo-remove" onClick={removeImage}>✕ Remove</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Patient */}
                                {formData.role === 'patient' && (
                                    <>
                                        <div className="auth-field">
                                            <label className="auth-label">Full Name *</label>
                                            <div className="auth-input-wrap"><span className="auth-input-icon">👤</span><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your full name" className="auth-input" required /></div>
                                        </div>
                                        <div className="auth-reg-row auth-reg-row--3">
                                            <div className="auth-field">
                                                <label className="auth-label">Mobile Number *</label>
                                                <div className="auth-input-wrap"><span className="auth-input-icon">📱</span><input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit number" className="auth-input" required /></div>
                                            </div>
                                            <div className="auth-field">
                                                <label className="auth-label">Age</label>
                                                <div className="auth-input-wrap"><span className="auth-input-icon">🎂</span><input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Your age" className="auth-input" min="1" max="120" /></div>
                                            </div>
                                            <div className="auth-field">
                                                <label className="auth-label">Gender</label>
                                                <div className="auth-input-wrap"><span className="auth-input-icon">⚧</span>
                                                    <select name="gender" value={formData.gender} onChange={handleChange} className="auth-input auth-select">
                                                        <option value="">Select</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Doctor */}
                                {formData.role === 'doctor' && (
                                    <>
                                        <div className="auth-reg-row auth-reg-row--2">
                                            <div className="auth-field"><label className="auth-label">Full Name *</label><div className="auth-input-wrap"><span className="auth-input-icon">👤</span><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Dr. Full Name" className="auth-input" required /></div></div>
                                            <div className="auth-field"><label className="auth-label">Contact Number *</label><div className="auth-input-wrap"><span className="auth-input-icon">📱</span><input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit number" className="auth-input" required /></div></div>
                                        </div>
                                        <div className="auth-reg-row auth-reg-row--2">
                                            <div className="auth-field"><label className="auth-label">Specialization *</label><div className="auth-input-wrap"><span className="auth-input-icon">🩺</span><input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="e.g., Cardiology" className="auth-input" required /></div></div>
                                            <div className="auth-field"><label className="auth-label">Department *</label><div className="auth-input-wrap"><span className="auth-input-icon">🏛️</span><input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g., Medicine" className="auth-input" required /></div></div>
                                        </div>
                                        <div className="auth-reg-row auth-reg-row--2">
                                            <div className="auth-field"><label className="auth-label">Qualification *</label><div className="auth-input-wrap"><span className="auth-input-icon">🎓</span><input type="text" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g., MBBS, MD" className="auth-input" required /></div></div>
                                            <div className="auth-field"><label className="auth-label">Experience (years)</label><div className="auth-input-wrap"><span className="auth-input-icon">📅</span><input type="number" name="experience" value={formData.experience} onChange={handleChange} placeholder="Years of experience" className="auth-input" min="0" /></div></div>
                                        </div>
                                    </>
                                )}

                                {/* Staff */}
                                {formData.role === 'staff' && (
                                    <>
                                        <div className="auth-reg-row auth-reg-row--2">
                                            <div className="auth-field"><label className="auth-label">Full Name *</label><div className="auth-input-wrap"><span className="auth-input-icon">👤</span><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter full name" className="auth-input" required /></div></div>
                                            <div className="auth-field"><label className="auth-label">Contact Number *</label><div className="auth-input-wrap"><span className="auth-input-icon">📱</span><input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit number" className="auth-input" required /></div></div>
                                        </div>
                                        <div className="auth-reg-row auth-reg-row--3">
                                            <div className="auth-field"><label className="auth-label">Role Type *</label><div className="auth-input-wrap"><span className="auth-input-icon">🏷️</span><select name="roleType" value={formData.roleType} onChange={handleChange} className="auth-input auth-select" required><option value="">Select</option><option value="Reception">Reception</option><option value="Support">Support</option></select></div></div>
                                            <div className="auth-field"><label className="auth-label">Department *</label><div className="auth-input-wrap"><span className="auth-input-icon">🏛️</span><input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g., OPD" className="auth-input" required /></div></div>
                                            <div className="auth-field"><label className="auth-label">Shift Time *</label><div className="auth-input-wrap"><span className="auth-input-icon">🕐</span><select name="shiftTime" value={formData.shiftTime} onChange={handleChange} className="auth-input auth-select" required><option value="">Select</option><option value="Morning">Morning</option><option value="Evening">Evening</option><option value="Night">Night</option></select></div></div>
                                        </div>
                                    </>
                                )}

                                {/* Pharmacy */}
                                {formData.role === 'pharmacy' && (
                                    <>
                                        <div className="auth-field"><label className="auth-label">Pharmacist Name *</label><div className="auth-input-wrap"><span className="auth-input-icon">👤</span><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter full name" className="auth-input" required /></div></div>
                                        <div className="auth-reg-row auth-reg-row--3">
                                            <div className="auth-field"><label className="auth-label">Contact Number *</label><div className="auth-input-wrap"><span className="auth-input-icon">📱</span><input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit number" className="auth-input" required /></div></div>
                                            <div className="auth-field"><label className="auth-label">License Number *</label><div className="auth-input-wrap"><span className="auth-input-icon">📋</span><input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="License number" className="auth-input" required /></div></div>
                                            <div className="auth-field"><label className="auth-label">Shift Timing *</label><div className="auth-input-wrap"><span className="auth-input-icon">🕐</span><input type="text" name="shiftTiming" value={formData.shiftTiming} onChange={handleChange} placeholder="e.g., 24/7" className="auth-input" required /></div></div>
                                        </div>
                                    </>
                                )}

                                {/* Laboratory */}
                                {formData.role === 'laboratory' && (
                                    <>
                                        <div className="auth-field"><label className="auth-label">Laboratory Name *</label><div className="auth-input-wrap"><span className="auth-input-icon">🔬</span><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter lab name" className="auth-input" required /></div></div>
                                        <div className="auth-reg-row auth-reg-row--2">
                                            <div className="auth-field"><label className="auth-label">Contact Number *</label><div className="auth-input-wrap"><span className="auth-input-icon">📱</span><input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit number" className="auth-input" required /></div></div>
                                            <div className="auth-field"><label className="auth-label">Lab Type *</label><div className="auth-input-wrap"><span className="auth-input-icon">🧪</span><input type="text" name="labType" value={formData.labType} onChange={handleChange} placeholder="e.g., Pathology" className="auth-input" required /></div></div>
                                        </div>
                                    </>
                                )}

                                {/* Messages */}
                                {error && (
                                    <div className="auth-alert auth-alert--error">
                                        <span className="auth-alert-icon">⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                )}
                                {success && (
                                    <div className="auth-alert auth-alert--success">
                                        <span className="auth-alert-icon">✅</span>
                                        <span>{success}</span>
                                    </div>
                                )}

                                {/* Submit */}
                                <button type="submit" className="auth-submit-btn" disabled={loading || !!success}>
                                    {loading ? (
                                        <><span className="auth-spinner"></span> Creating Account...</>
                                    ) : success ? (
                                        <>✅ Redirecting to Login...</>
                                    ) : (
                                        <>Create {selectedRole?.label} Account →</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register;
