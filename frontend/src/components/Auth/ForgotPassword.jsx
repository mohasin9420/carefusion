import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RoleAuth.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // TODO: Implement forgot password API call
            // This will send a password reset email to the user

            // Simulated response for now
            await new Promise(resolve => setTimeout(resolve, 1500));

            setMessage('Password reset instructions have been sent to your email. Please check your inbox.');
            setEmail('');
        } catch (err) {
            setError('Failed to send password reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="role-auth-container">
            <div className="role-auth-card">
                <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

                <div className="role-header" style={{ borderColor: '#667eea' }}>
                    <span className="role-icon" style={{ color: '#667eea', fontSize: '3rem' }}>🔐</span>
                    <h2>Forgot Password</h2>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Enter your email address and we'll send you instructions to reset your password.
                    </p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {message && <div className="alert alert-success">{message}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your registered email"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                        style={{ backgroundColor: '#667eea' }}
                    >
                        {loading ? 'Sending...' : 'Send Reset Instructions'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <a href="/" style={{ color: '#667eea', textDecoration: 'none', fontSize: '0.9rem' }}>
                            Remember your password? Go back to login
                        </a>
                    </div>
                </form>

                <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e40af' }}>
                        <strong>ℹ️ Note:</strong> For security reasons, we cannot retrieve your original password.
                        We will send you instructions to create a new password.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
