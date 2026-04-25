import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminEmailSettings = () => {
    const [config, setConfig] = useState({ smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', fromName: 'Hospital Management System', fromEmail: '', isConfigured: false });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [testEmail, setTestEmail] = useState('');

    useEffect(() => {
        adminAPI.getEmailConfig().then(res => {
            setConfig({ ...config, ...res.data });
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg({ text: '', type: '' });
        try {
            await adminAPI.updateEmailConfig(config);
            setMsg({ text: '✅ Email configuration saved successfully!', type: 'success' });
        } catch (err) {
            setMsg({ text: '❌ ' + (err.response?.data?.message || 'Failed to save configuration'), type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!testEmail) return setMsg({ text: 'Please enter a test email address.', type: 'error' });
        setTesting(true);
        setMsg({ text: '', type: '' });
        try {
            await adminAPI.testEmailConfig({ testEmail, useCustom: true, ...config });
            setMsg({ text: `✅ Test email sent to ${testEmail}! Check your inbox.`, type: 'success' });
        } catch (err) {
            setMsg({ text: '❌ ' + (err.response?.data?.message || 'Failed to send test email. Check your SMTP settings.'), type: 'error' });
        } finally {
            setTesting(false);
        }
    };

    const inp = { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' };

    if (loading) return <div style={{ padding: 20, color: '#64748b' }}>Loading email configuration...</div>;

    return (
        <div style={{ maxWidth: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 28 }}>📧</span>
                <div>
                    <h3 style={{ margin: 0, fontSize: 18, color: '#1e293b' }}>Email / SMTP Configuration</h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Configure the email server used to send OTP verifications and notifications.</p>
                </div>
                <span style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: config.isConfigured ? '#dcfce7' : '#fef3c7', color: config.isConfigured ? '#15803d' : '#d97706' }}>
                    {config.isConfigured ? '✅ Configured' : '⚠️ Not Configured'}
                </span>
            </div>

            <form onSubmit={handleSave} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                {/* System Toggle Section */}
                <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h4 style={{ margin: 0, fontSize: 14, color: '#1e293b' }}>🔐 Email OTP Verification</h4>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>If disabled, new patients will be auto-verified upon registration.</p>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 26, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={config.otpEnabled}
                            onChange={e => setConfig({ ...config, otpEnabled: e.target.checked })}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: config.otpEnabled ? '#2563eb' : '#cbd5e1',
                            transition: '.3s', borderRadius: 34,
                        }}>
                            <span style={{
                                position: 'absolute', content: '""', height: 18, width: 18, left: config.otpEnabled ? 28 : 4, bottom: 4,
                                backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
                            }} />
                        </span>
                    </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, marginBottom: 12 }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>SMTP Host *</label>
                        <input style={inp} value={config.smtpHost} onChange={e => setConfig({ ...config, smtpHost: e.target.value })} placeholder="smtp.gmail.com" required />
                    </div>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Port *</label>
                        <input style={inp} type="number" value={config.smtpPort} onChange={e => setConfig({ ...config, smtpPort: parseInt(e.target.value) })} placeholder="587" required />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>SMTP Username (Email) *</label>
                        <input style={inp} type="email" value={config.smtpUser} onChange={e => setConfig({ ...config, smtpUser: e.target.value })} placeholder="your@gmail.com" required />
                    </div>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>SMTP Password / App Password *</label>
                        <input style={inp} type="password" value={config.smtpPass} onChange={e => setConfig({ ...config, smtpPass: e.target.value })} placeholder="Gmail App Password" />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Sender Name</label>
                        <input style={inp} value={config.fromName} onChange={e => setConfig({ ...config, fromName: e.target.value })} placeholder="Hospital Management System" />
                    </div>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Sender Email</label>
                        <input style={inp} type="email" value={config.fromEmail} onChange={e => setConfig({ ...config, fromEmail: e.target.value })} placeholder="noreply@yourhospital.com" />
                    </div>
                </div>

                {msg.text && (
                    <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: msg.type === 'success' ? '#dcfce7' : '#fef2f2', color: msg.type === 'success' ? '#15803d' : '#dc2626', border: `1px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}` }}>
                        {msg.text}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="submit" disabled={saving} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                        {saving ? 'Saving...' : '💾 Save Configuration'}
                    </button>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                        <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Send test to..." style={{ ...inp, width: 200 }} />
                        <button type="button" onClick={handleTest} disabled={testing}
                            style={{ padding: '10px 18px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>
                            {testing ? 'Sending...' : '✉️ Test'}
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: 16, padding: '12px 14px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#0369a1' }}>
                        💡 <strong>Gmail tip:</strong> Enable 2FA on your Gmail account and use a <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Google App Password</a> instead of your regular password. Use host <code>smtp.gmail.com</code>, port <code>587</code>.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default AdminEmailSettings;
