import { Routes, Route, Link } from 'react-router-dom';
import Navbar from '../Shared/Navbar';
import Sidebar from '../Shared/Sidebar';
import '../Patient/PatientDashboard.css';
import { useState, useEffect } from 'react';
import { pharmacyAPI } from '../../services/api';

const PharmacyDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const sidebarLinks = [
        { to: '/pharmacy', label: 'Dashboard' },
        { to: '/pharmacy/prescriptions', label: 'Prescriptions' },
        { to: '/pharmacy/inventory', label: 'Inventory' },
        { to: '/pharmacy/sales', label: 'Sales Report' },
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
                        <Route index element={<PharmacyHome />} />
                        <Route path="prescriptions" element={<Prescriptions />} />
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="sales" element={<SalesReport />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const PharmacyHome = () => {
    const [stats, setStats] = useState({ pending: 0, ready: 0, dispensed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            pharmacyAPI.getPrescriptions('pending'),
            pharmacyAPI.getPrescriptions('ready'),
            pharmacyAPI.getPrescriptions('dispensed')
        ])
            .then(([pendingRes, readyRes, dispensedRes]) => {
                setStats({
                    pending: pendingRes.data.length,
                    ready: readyRes.data.length,
                    dispensed: dispensedRes.data.length
                });
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="pharmacy-home-view">
            <div className="flex justify-between items-end mb-xl animate-fade">
                <div>
                    <h1 className="m-0 text-4xl">Pharmacy Command Deck</h1>
                    <p className="text-slate-500 font-medium">Monitoring real-time dispensing and inventory health protocol.</p>
                </div>
                <div className="glass-surface px-6 py-3 rounded-2xl text-right">
                    <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">System Status</div>
                    <div className="flex items-center gap-2 justify-end">
                        <div className="w-3 h-3 rounded-full bg-success animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-sm font-black text-slate-700">Live Operations</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-4 mb-xl">
                <div className="modern-stat-card glass-surface" style={{ '--role-accent': 'var(--warning)', '--role-light': '#fef3c7' }}>
                    <div className="stat-icon-wrapper">⏳</div>
                    <div className="stat-info">
                        <h3>Awaiting Review</h3>
                        <div className="stat-value">{stats.pending}</div>
                    </div>
                </div>
                <div className="modern-stat-card glass-surface" style={{ '--role-accent': 'var(--primary)', '--role-light': '#dbeafe' }}>
                    <div className="stat-icon-wrapper">📦</div>
                    <div className="stat-info">
                        <h3>Ready Handover</h3>
                        <div className="stat-value">{stats.ready}</div>
                    </div>
                </div>
                <div className="modern-stat-card glass-surface" style={{ '--role-accent': 'var(--success)', '--role-light': '#ecfdf5' }}>
                    <div className="stat-icon-wrapper">💊</div>
                    <div className="stat-info">
                        <h3>Total Dispensed</h3>
                        <div className="stat-value">{stats.dispensed}</div>
                    </div>
                </div>
                <div className="modern-stat-card glass-surface" style={{ '--role-accent': 'var(--danger)', '--role-light': '#fef2f2' }}>
                    <div className="stat-icon-wrapper">⚠️</div>
                    <div className="stat-info">
                        <h3>Stock Alerts</h3>
                        <div className="stat-value text-red-600">0</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Prescriptions = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchPrescriptions = () => {
        setLoading(true);
        const statusParam = filter === 'all' ? undefined : filter;
        pharmacyAPI.getPrescriptions(statusParam)
            .then(res => setPrescriptions(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPrescriptions();
    }, [filter]);

    const handleStatusUpdate = async (id, status) => {
        setActionLoading(id);
        try {
            await pharmacyAPI.updatePrescriptionStatus(id, status);
            fetchPrescriptions();
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDispense = async (id) => {
        setActionLoading(id);
        try {
            await pharmacyAPI.dispensePrescription(id);
            fetchPrescriptions();
        } catch (error) {
            console.error(error);
            alert('Failed to dispense');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status) => {
        const map = { pending: 'warning', ready: 'info', out_of_stock: 'danger', dispensed: 'success' };
        return map[status] || 'secondary';
    };

    return (
        <div className="prescriptions-dispensing-view">
            <div className="flex justify-between items-center mb-xl">
                <div>
                    <h1 className="m-0">Dispensing Pipeline</h1>
                    <p className="text-gray-500 font-medium">Verify medication and update fulfillment status.</p>
                </div>
                <div className="flex gap-md items-center">
                    <span className="text-sm font-bold text-gray-400 uppercase">PIPELINE FILTER:</span>
                    <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto', minWidth: '180px' }}>
                        <option value="all">Full Queue</option>
                        <option value="pending">Awaiting Check</option>
                        <option value="ready">Ready to Dispense</option>
                        <option value="out_of_stock">Inventory Issues</option>
                        <option value="dispensed">History (Dispensed)</option>
                    </select>
                </div>
            </div>

            {loading ? <div className="spinner-sm mx-auto"></div> : (
                <div className="grid grid-2 gap-lg">
                    {prescriptions.length === 0 ? (
                        <div className="col-span-2 p-2xl text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                             <div className="text-4xl mb-md">💊</div>
                             <p className="text-gray-500 font-medium">The dispensing pipeline is currently empty.</p>
                        </div>
                    ) : (
                        prescriptions.map((rx) => (
                            <div key={rx._id} className={`card p-xl border-none shadow-sm hover:shadow-md transition-all ${rx.status === 'out_of_stock' ? 'bg-red-50' : 'bg-white'}`} style={{ borderRadius: '24px' }}>
                                <div className="flex justify-between items-start mb-lg">
                                    <div>
                                        <h3 className="m-0 text-xl font-black text-gray-900">{rx.patientId?.fullName}</h3>
                                        <div className="text-sm text-indigo-600 font-bold mt-1">Dr. {rx.doctorId?.fullName}</div>
                                        <div className="text-xs text-gray-400 font-mono mt-1">REF: {rx.prescriptionId || rx._id.slice(-8).toUpperCase()}</div>
                                    </div>
                                    <span className={`m-badge ${
                                        rx.status === 'dispensed' ? 'm-badge-green' :
                                        rx.status === 'out_of_stock' ? 'm-badge-red' :
                                        rx.status === 'ready' ? 'm-badge-blue' : 'm-badge-yellow'
                                    }`}>
                                        {rx.status?.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-lg mb-lg border border-gray-100">
                                    <label className="profile-label text-[10px] text-gray-400 mb-2">CLINICAL DIAGNOSIS</label>
                                    <div className="font-bold text-gray-800 mb-4">{rx.diagnosis}</div>
                                    
                                    <label className="profile-label text-[10px] text-gray-400 mb-2">MEDICATION REGIMEN</label>
                                    <div className="space-y-sm">
                                        {rx.medicines?.map((med, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-sm bg-white rounded-lg border border-gray-100 shadow-sm">
                                                <span className="text-blue-500">💊</span>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-gray-900">{med.name}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold">{med.dosage} · {med.frequency} · {med.duration}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {rx.status !== 'dispensed' && (
                                    <div className="flex gap-md">
                                        {rx.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleStatusUpdate(rx._id, 'ready')} className="btn btn-primary flex-1 shadow-lg" disabled={actionLoading === rx._id}>
                                                    Ready for Handover
                                                </button>
                                                <button onClick={() => handleStatusUpdate(rx._id, 'out_of_stock')} className="btn btn-outline-danger" disabled={actionLoading === rx._id}>
                                                    Out of Stock
                                                </button>
                                            </>
                                        )}
                                        {(rx.status === 'ready' || rx.status === 'out_of_stock') && (
                                            <>
                                                {rx.status === 'out_of_stock' && (
                                                    <button onClick={() => handleStatusUpdate(rx._id, 'ready')} className="btn btn-outline-primary" disabled={actionLoading === rx._id}>
                                                        Mark as Restocked
                                                    </button>
                                                )}
                                                <button onClick={() => handleDispense(rx._id)} className="btn btn-success flex-1 shadow-lg" disabled={actionLoading === rx._id}>
                                                    {actionLoading === rx._id ? 'Processing...' : '✅ Finalize Dispensing'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const Inventory = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({ name: '', genericName: '', quantity: 0, minQuantity: 10, unit: 'strip', category: 'tablet' });

    const fetchInventory = () => {
        setLoading(true);
        pharmacyAPI.getInventory()
            .then(res => setMedicines(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleAddMedicine = async (e) => {
        e.preventDefault();
        try {
            await pharmacyAPI.addMedicine(formData);
            setShowAdd(false);
            setFormData({ name: '', genericName: '', quantity: 0, minQuantity: 10, unit: 'strip', category: 'tablet' });
            fetchInventory();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add medicine');
        }
    };

    const handleUpdateQuantity = async (id, quantity) => {
        try {
            await pharmacyAPI.updateInventory(id, { quantity });
            fetchInventory();
        } catch (err) {
            alert('Failed to update');
        }
    };

    const getStatusBadge = (status) => {
        const map = { in_stock: 'success', low_stock: 'warning', out_of_stock: 'danger' };
        return map[status] || 'secondary';
    };

    return (
        <div className="inventory-management-view">
            <div className="flex justify-between items-center mb-xl">
                <div>
                    <h1 className="m-0">Medicine Inventory</h1>
                    <p className="text-gray-500 font-medium">Manage stock levels and medicine configurations.</p>
                </div>
                <button onClick={() => setShowAdd(!showAdd)} className={`btn ${showAdd ? 'btn-outline-danger' : 'btn-primary'} shadow-lg`} style={{ borderRadius: '12px' }}>
                    {showAdd ? '✕ Close Form' : '➕ Register New Medicine'}
                </button>
            </div>

            {showAdd && (
                <div className="card p-xl mb-xl border-none shadow-md bg-white animate-in fade-in slide-in-from-top-4 duration-300" style={{ borderRadius: '24px' }}>
                    <div className="flex items-center gap-md mb-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">💊</div>
                        <h3 className="m-0 text-xl font-black">Stock Entry</h3>
                    </div>
                    <form onSubmit={handleAddMedicine} className="grid grid-2 gap-xl">
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="profile-label text-[10px] text-gray-400">MEDICINE NAME (TRADE NAME)</label>
                            <input className="input" placeholder="e.g. Paracetamol 500mg" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="profile-label text-[10px] text-gray-400">GENERIC COMPOSITION</label>
                            <input className="input" placeholder="e.g. Acetaminophen" value={formData.genericName} onChange={(e) => setFormData({ ...formData, genericName: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="profile-label text-[10px] text-gray-400">CATEGORY</label>
                            <select className="input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                <option value="tablet">Tablets / Oral</option>
                                <option value="capsule">Capsules</option>
                                <option value="syrup">Syrups / Liquids</option>
                                <option value="injection">Injections / IV</option>
                                <option value="cream">Creams / Ointments</option>
                                <option value="other">General Equipment</option>
                            </select>
                        </div>
                        <div className="grid grid-2 gap-md">
                            <div className="form-group">
                                <label className="profile-label text-[10px] text-gray-400">INITIAL QTY</label>
                                <input type="number" className="input text-center font-bold" value={formData.quantity || ''} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} min="0" />
                            </div>
                            <div className="form-group">
                                <label className="profile-label text-[10px] text-gray-400">MEASUREMENT</label>
                                <select className="input" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>
                                    <option value="strip">Strips</option>
                                    <option value="bottle">Bottles</option>
                                    <option value="box">Boxes</option>
                                    <option value="piece">Units</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="profile-label text-[10px] text-gray-400">CRITICAL STOCK THRESHOLD</label>
                            <input type="number" className="input text-center font-bold text-red-600" value={formData.minQuantity || ''} onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 10 })} min="0" />
                        </div>
                        <button type="submit" className="btn btn-primary w-full h-12 shadow-lg" style={{ gridColumn: 'span 2' }}>
                            Verify & Add to Inventory
                        </button>
                    </form>
                </div>
            )}

            {loading ? <div className="spinner-sm mx-auto"></div> : (
                <div className="medical-ledger-container">
                    <div className="medical-ledger-header">
                        <h3>Stock Audit Ledger</h3>
                        <div className="m-badge m-badge-blue">Total Skus: {medicines.length}</div>
                    </div>
                    <div className="table-responsive">
                        <table className="medical-ledger-table">
                            <thead>
                                <tr>
                                    <th>Medicine Identity</th>
                                    <th>Category</th>
                                    <th className="text-center">Current Inventory</th>
                                    <th className="text-center">Restock Status</th>
                                    <th className="text-center">Audit Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medicines.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-xl text-gray-400 font-medium">No inventory records finalized. Add your first stock item.</td></tr>
                                ) : (
                                    medicines.map((med) => (
                                        <tr key={med._id}>
                                            <td>
                                                <div className="font-black text-gray-900">{med.name}</div>
                                                {med.genericName && <div className="text-xs text-indigo-500 font-bold uppercase">{med.genericName}</div>}
                                            </td>
                                            <td>
                                                <span className="text-xs font-bold uppercase text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{med.category}</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        defaultValue={med.quantity} 
                                                        className="input text-center font-black" 
                                                        style={{ width: '90px', background: '#f8fafc', padding: '4px 8px' }}
                                                        onBlur={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v !== med.quantity) handleUpdateQuantity(med._id, v); }} 
                                                    />
                                                    <span className="text-sm font-bold text-gray-400">{med.unit}</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`m-badge ${
                                                    med.status === 'in_stock' ? 'm-badge-green' : 
                                                    med.status === 'low_stock' ? 'm-badge-yellow' : 'm-badge-red'
                                                }`}>
                                                    {med.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button className="btn btn-sm btn-link text-indigo-600 font-bold">Audit Logs</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const SalesReport = () => {
    const [data, setData] = useState({ prescriptions: [], summary: {} });
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchReport = () => {
        setLoading(true);
        pharmacyAPI.getSalesReport(startDate || undefined, endDate || undefined)
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchReport();
    }, []);

    return (
        <div className="sales-report-view">
            <div className="flex justify-between items-end mb-xl">
                <div>
                    <h1 className="m-0">Dispensing Audit Report</h1>
                    <p className="text-gray-500 font-medium">Historical analysis of medication fulfillment.</p>
                </div>
                <div className="flex gap-md">
                    <div className="date-selector flex items-center gap-sm bg-white p-sm rounded-xl border border-gray-100 shadow-sm">
                        <input type="date" className="input border-none shadow-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <span className="text-gray-300">→</span>
                        <input type="date" className="input border-none shadow-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <button onClick={fetchReport} className="btn btn-primary px-xl shadow-lg" style={{ borderRadius: '12px' }}>📊 Audit Scope</button>
                </div>
            </div>

            <div className="grid grid-3 gap-lg mb-xl">
                 <div className="modern-stat-card bg-indigo-600 text-white">
                    <div className="stat-info">
                        <h3 className="text-indigo-100">Total Fulfillments</h3>
                        <div className="stat-value text-white">{data.summary?.totalDispensed ?? 0}</div>
                        <p className="text-xs text-indigo-200 mt-1 uppercase font-bold tracking-wider">Confirmed Dispatch</p>
                    </div>
                </div>
                <div className="modern-stat-card" style={{ gridColumn: 'span 2' }}>
                    <div className="stat-info">
                        <h3>Active Audit Period</h3>
                        <div className="stat-value text-lg" style={{ fontSize: '1.5rem' }}>
                            {startDate && endDate ? `${new Date(startDate).toLocaleDateString()} — ${new Date(endDate).toLocaleDateString()}` : 'Historical (Lifetime) Cumulative Data'}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Status: High Integrity Financial Log</p>
                    </div>
                </div>
            </div>

            {loading ? <div className="spinner-sm mx-auto"></div> : (
                <div className="medical-ledger-container">
                    <div className="medical-ledger-header">
                        <h3>Dispensing Logbook</h3>
                        <div className="m-badge m-badge-green">Records Verified</div>
                    </div>
                    <div className="table-responsive">
                        <table className="medical-ledger-table">
                            <thead>
                                <tr>
                                    <th>Patient Participant</th>
                                    <th>Prescribing Doctor</th>
                                    <th>Audit ID</th>
                                    <th>Fulfillment Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.prescriptions?.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-2xl text-gray-400 italic">No dispensing activity detected during the selected audit scope.</td></tr>
                                ) : (
                                    data.prescriptions?.map((p) => (
                                        <tr key={p._id}>
                                            <td>
                                                <div className="font-black text-gray-900">{p.patientId?.fullName}</div>
                                                <div className="text-xs text-gray-400 font-bold uppercase">{p.patientId?._id?.slice(-6)}</div>
                                            </td>
                                            <td>
                                                <div className="font-bold text-indigo-600 uppercase text-xs tracking-tight">Dr. {p.doctorId?.fullName}</div>
                                            </td>
                                            <td><code className="bg-gray-100 px-2 py-1 rounded-md text-sm font-mono">{p._id.slice(-10).toUpperCase()}</code></td>
                                            <td>
                                                <div className="text-sm font-black text-gray-800">
                                                    {p.dispensedAt ? new Date(p.dispensedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyDashboard;
