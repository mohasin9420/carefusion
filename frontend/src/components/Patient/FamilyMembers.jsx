import { useState, useEffect } from 'react';
import { patientAPI } from '../../services/api';
import './FamilyMembers.css';

const RELATIONS = ['mother', 'father', 'child', 'spouse', 'sibling', 'other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

const emptyForm = { name: '', relation: '', age: '', gender: '', bloodGroup: '' };

const FamilyMembers = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null); // null = add, obj = edit
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await patientAPI.getFamilyMembers();
            setMembers(res.data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load family members');
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => {
        setEditingMember(null);
        setForm(emptyForm);
        setError('');
        setShowModal(true);
    };

    const openEdit = (member) => {
        setEditingMember(member);
        setForm({
            name: member.name || '',
            relation: member.relation || '',
            age: member.age || '',
            gender: member.gender || '',
            bloodGroup: member.bloodGroup || ''
        });
        setError('');
        setShowModal(true);
    };

    const handleChange = (e) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name.trim() || !form.relation) {
            setError('Name and relation are required.');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                name: form.name.trim(),
                relation: form.relation,
                age: form.age ? Number(form.age) : undefined,
                gender: form.gender || undefined,
                bloodGroup: form.bloodGroup || undefined
            };
            if (editingMember) {
                await patientAPI.updateFamilyMember(editingMember._id, payload);
                setSuccessMsg('Family member updated!');
            } else {
                await patientAPI.addFamilyMember(payload);
                setSuccessMsg('Family member added!');
            }
            setShowModal(false);
            await fetchMembers();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save family member');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (memberId, memberName) => {
        if (!window.confirm(`Remove ${memberName} from your family account?`)) return;
        try {
            await patientAPI.deleteFamilyMember(memberId);
            setSuccessMsg(`${memberName} removed.`);
            await fetchMembers();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove member');
        }
    };

    const relationIcon = (rel) => {
        const icons = { mother: '👩', father: '👨', child: '🧒', spouse: '💑', sibling: '🧑', other: '👤' };
        return icons[rel] || '👤';
    };

    const totalSlots = 1 + members.length;

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="family-members-container">
            <div className="family-header">
                <div>
                    <h1>👨‍👩‍👧‍👦 Family Members</h1>
                    <p className="family-subtitle">
                        Manage your family account. You can book <strong>{totalSlots} appointment{totalSlots > 1 ? 's' : ''}</strong> per day
                        {members.length > 0 ? ` (1 for you + ${members.length} for family)` : ' (add family members to book more)'}.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    + Add Family Member
                </button>
            </div>

            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            {error && !showModal && <div className="alert alert-error">{error}</div>}

            {/* Info Banner */}
            <div className="family-info-banner">
                <span className="info-icon">ℹ️</span>
                <span>
                    Family members share your registered phone number &amp; email. They don't need a separate login —
                    just select them when booking an appointment.
                </span>
            </div>

            {/* Slot Usage */}
            <div className="slot-usage-card">
                <div className="slot-usage-row">
                    <span>👤 You (Main Account)</span>
                    <span className="slot-badge">Primary Slot</span>
                </div>
                {members.map(m => (
                    <div key={m._id} className="slot-usage-row">
                        <span>{relationIcon(m.relation)} {m.name} <span className="rel-label">({m.relation})</span></span>
                        <span className="slot-badge">+1 Family Slot</span>
                    </div>
                ))}
                <div className="slot-usage-total">
                    <span>Total Daily Capacity</span>
                    <span className="total-slots">{totalSlots}</span>
                </div>
            </div>

            {/* Members List */}
            {members.length === 0 ? (
                <div className="empty-family">
                    <div className="empty-icon">👨‍👩‍👧</div>
                    <h3>No family members added yet</h3>
                    <p className="mb-lg">Add your family members so you can book appointments for them easily.</p>
                    <button className="btn btn-primary btn-lg" onClick={openAdd}>Add First Member</button>
                </div>
            ) : (
                <div className="members-grid">
                    {members.map(member => (
                        <div key={member._id} className="member-card">
                            <div className="member-header">
                                <div className="member-avatar">{relationIcon(member.relation)}</div>
                                <div className="member-name-area">
                                    <h3>{member.name}</h3>
                                    <span className="member-relation">{member.relation}</span>
                                </div>
                            </div>
                            
                            <div className="member-details-strip">
                                {member.age && <span>{member.age} yrs</span>}
                                {member.gender && <span>• {member.gender}</span>}
                                {member.bloodGroup && (
                                    <span className="blood-badge-mini">
                                        • {member.bloodGroup}
                                    </span>
                                )}
                            </div>

                            <div className="member-card-actions">
                                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(member)}>
                                    Edit Profile
                                </button>
                                <button className="btn btn-sm btn-danger-outline" onClick={() => handleDelete(member._id, member.name)}>
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingMember ? '✏️ Edit Family Member' : '➕ Add Family Member'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input
                                        className="input"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Ravi Kumar"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Relation *</label>
                                    <select className="input" name="relation" value={form.relation} onChange={handleChange} required>
                                        <option value="">Select Relation</option>
                                        {RELATIONS.map(r => (
                                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Age</label>
                                    <input
                                        type="number"
                                        className="input"
                                        name="age"
                                        value={form.age}
                                        onChange={handleChange}
                                        min="0"
                                        max="120"
                                        placeholder="e.g. 45"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Gender</label>
                                    <select className="input" name="gender" value={form.gender} onChange={handleChange}>
                                        <option value="">Select Gender</option>
                                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Blood Group</label>
                                <select className="input" name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                                    <option value="">Select Blood Group</option>
                                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : editingMember ? 'Update Member' : 'Add Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyMembers;
