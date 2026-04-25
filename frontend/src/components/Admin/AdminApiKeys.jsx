import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const PROVIDERS = [
    { value: 'groq', label: 'Groq (LLaMA 3) — FREE', icon: '⚡' },
    { value: 'mistral', label: 'Mistral AI — FREE', icon: '🌊' },
    { value: 'gemini', label: 'Google Gemini', icon: '🤖' },
    { value: 'openai', label: 'OpenAI (GPT)', icon: '🧠' },
    { value: 'anthropic', label: 'Anthropic Claude', icon: '💜' },
    { value: 'azure-openai', label: 'Azure OpenAI', icon: '☁️' },
    { value: 'other', label: 'Other', icon: '🔑' }
];

const AdminApiKeys = () => {
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ provider: 'gemini', keyLabel: '', keyValue: '' });
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(null); // keyId being tested
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [testResults, setTestResults] = useState({});

    const load = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getApiKeys();
            setKeys(res.data);
        } catch (err) {
            setMsg({ text: 'Failed to load API keys', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg({ text: '', type: '' });
        try {
            await adminAPI.addApiKey(form);
            setMsg({ text: '✅ API key added successfully!', type: 'success' });
            setForm({ provider: 'gemini', keyLabel: '', keyValue: '' });
            setShowForm(false);
            load();
        } catch (err) {
            setMsg({ text: '❌ ' + (err.response?.data?.message || 'Failed to add API key'), type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (keyId) => {
        if (!confirm('Delete this API key?')) return;
        try {
            await adminAPI.deleteApiKey(keyId);
            setMsg({ text: '✅ API key deleted.', type: 'success' });
            load();
        } catch {
            setMsg({ text: '❌ Failed to delete key.', type: 'error' });
        }
    };

    const handleToggle = async (key) => {
        try {
            await adminAPI.updateApiKey(key._id, { isActive: !key.isActive });
            load();
        } catch {
            setMsg({ text: '❌ Failed to update key.', type: 'error' });
        }
    };

    const handleTest = async (keyId) => {
        setTesting(keyId);
        setTestResults({ ...testResults, [keyId]: null });
        try {
            const res = await adminAPI.testApiKey(keyId);
            setTestResults({ ...testResults, [keyId]: { ok: true, msg: res.data.message } });
        } catch (err) {
            setTestResults({ ...testResults, [keyId]: { ok: false, msg: err.response?.data?.message || 'Test failed.' } });
        } finally {
            setTesting(null);
        }
    };

    const providerInfo = (pv) => PROVIDERS.find(p => p.value === pv) || { label: pv, icon: '🔑' };
    const inp = { padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' };

    return (
        <div style={{ maxWidth: 750 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 28 }}>🔑</span>
                <div>
                    <h3 style={{ margin: 0, fontSize: 18, color: '#1e293b' }}>AI API Key Management</h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Add API keys for Gemini, OpenAI, and other AI providers to power the Insurance Claim Assistant.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{ marginLeft: 'auto', padding: '8px 18px', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                    {showForm ? '✕ Cancel' : '+ Add API Key'}
                </button>
            </div>

            {msg.text && (
                <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: msg.type === 'success' ? '#dcfce7' : '#fef2f2', color: msg.type === 'success' ? '#15803d' : '#dc2626', border: `1px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}` }}>
                    {msg.text}
                </div>
            )}

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleAdd} style={{ background: '#fff', border: '2px solid #7c3aed', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                    <h4 style={{ margin: '0 0 16px', color: '#5b21b6', fontSize: 15 }}>Add New API Key</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Provider *</label>
                            <select style={inp} value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} required>
                                {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Key Label *</label>
                            <input style={inp} value={form.keyLabel} onChange={e => setForm({ ...form, keyLabel: e.target.value })} placeholder="e.g. Main Gemini Key" required />
                        </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>API Key *</label>
                        <input style={inp} type="password" value={form.keyValue} onChange={e => setForm({ ...form, keyValue: e.target.value })} placeholder="Paste your API key here" required />
                    </div>
                    <button type="submit" disabled={saving} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                        {saving ? 'Saving...' : '💾 Save API Key'}
                    </button>
                </form>
            )}

            {/* Keys Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>Loading...</div>
            ) : keys.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                    <p style={{ fontSize: 40, margin: '0 0 12px' }}>🔑</p>
                    <p style={{ color: '#64748b' }}>No API keys configured yet.</p>
                    <p style={{ color: '#94a3b8', fontSize: 13 }}>Add a Gemini API key to enable the AI Insurance Claim Assistant.</p>
                </div>
            ) : (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                    {keys.map((key, idx) => {
                        const pInfo = providerInfo(key.provider);
                        const result = testResults[key._id];
                        return (
                            <div key={key._id} style={{ padding: 16, borderBottom: idx < keys.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 24 }}>{pInfo.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{key.keyLabel}</p>
                                        <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{pInfo.label} &nbsp;|&nbsp; {key.keyValueMasked} &nbsp;|&nbsp; Added {new Date(key.addedAt).toLocaleDateString()}</p>
                                        {result && (
                                            <p style={{ margin: '4px 0 0', fontSize: 12, color: result.ok ? '#15803d' : '#dc2626', fontWeight: 600 }}>{result.msg}</p>
                                        )}
                                    </div>
                                    {/* Active Toggle */}
                                    <span
                                        onClick={() => handleToggle(key)}
                                        style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: key.isActive ? '#dcfce7' : '#f1f5f9', color: key.isActive ? '#15803d' : '#94a3b8' }}>
                                        {key.isActive ? '✅ Active' : '⏸ Inactive'}
                                    </span>
                                    <button onClick={() => handleTest(key._id)} disabled={testing === key._id}
                                        style={{ padding: '6px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                        {testing === key._id ? '⏳' : '🧪 Test'}
                                    </button>
                                    <button onClick={() => handleDelete(key._id)}
                                        style={{ padding: '6px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                        🗑 Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{ marginTop: 16, padding: '12px 14px', background: '#fefce8', borderRadius: 8, border: '1px solid #fde68a' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
                    🔒 API keys are stored securely. Only the last 4 characters are displayed. To get a Gemini API key, visit{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Google AI Studio</a>.
                </p>
            </div>
        </div>
    );
};

export default AdminApiKeys;
