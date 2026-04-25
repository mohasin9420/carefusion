import { Routes, Route, Link } from 'react-router-dom';
import Navbar from '../Shared/Navbar';
import Sidebar from '../Shared/Sidebar';
import '../Patient/PatientDashboard.css';
import { useState, useEffect, useRef } from 'react';
import { laboratoryAPI } from '../../services/api';
import './LaboratoryDashboard.css';
import LabExpenseTracker from './LabExpenseTracker';


const LaboratoryDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const sidebarLinks = [
        { to: '/laboratory', label: 'Dashboard' },
        { to: '/laboratory/tests', label: 'Test Requests' },
        { to: '/laboratory/expenses', label: '💰 Expenses' },
    ];

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="dashboard-laboratory">
            <Navbar onToggleSidebar={toggleSidebar} />
            <div className="dashboard-layout">
                <Sidebar 
                    links={sidebarLinks} 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)} 
                />
                <main className="dashboard-main">
                    <Routes>
                        <Route index element={<LaboratoryHome />} />
                        <Route path="tests" element={<TestRequests />} />
                        <Route path="expenses" element={<LabExpenseTracker />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Laboratory Home
───────────────────────────────────────────────────────────── */
const LaboratoryHome = () => {
    const [stats, setStats] = useState({ pending: 0, completed: 0 });
    const [finStats, setFinStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            laboratoryAPI.getLabTests('requested'),
            laboratoryAPI.getLabTests('completed'),
            laboratoryAPI.getExpenseSummary()
        ])
            .then(([requestedRes, completedRes, expenseRes]) => {
                setStats({
                    pending: requestedRes.data.length,
                    completed: completedRes.data.length
                });
                setFinStats(expenseRes.data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const formatCurrency = (n) => 
        `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="lab-home-view">
            <div className="flex justify-between items-end mb-xl animate-fade">
                <div>
                    <h1 className="m-0 text-4xl font-black tracking-tight">Diagnostic Command Center</h1>
                    <p className="text-slate-500 font-medium">Overseeing clinical testing and laboratory revenue protocol.</p>
                </div>
                <div className="glass-surface px-6 py-3 rounded-2xl text-right">
                    <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Laboratory Status</div>
                    <div className="flex items-center gap-2 justify-end">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
                        <span className="text-sm font-black text-slate-700">Prime Operations</span>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-2 mb-xl">
                <div className="modern-stat-card glass-surface" style={{ '--role-accent': 'var(--primary)', '--role-light': '#eff6ff' }}>
                    <div className="stat-icon-wrapper">🧪</div>
                    <div className="stat-info">
                        <h3>Awaiting Processing</h3>
                        <div className="stat-value">{stats.pending}</div>
                    </div>
                </div>
                <div className="modern-stat-card glass-surface" style={{ '--role-accent': 'var(--success)', '--role-light': '#f0fdf4' }}>
                    <div className="stat-icon-wrapper">✅</div>
                    <div className="stat-info">
                        <h3>Reports Finalized</h3>
                        <div className="stat-value">{stats.completed}</div>
                    </div>
                </div>
                {finStats && (
                    <div className="modern-stat-card bg-indigo-600 text-white col-span-2">
                        <div className="flex justify-between items-center w-full">
                            <div className="stat-info">
                                <h3 className="text-indigo-100">Overall Revenue (All Time)</h3>
                                <div className="stat-value text-white text-4xl">{formatCurrency(finStats.allTime.total)}</div>
                                <div className="flex gap-4 mt-3">
                                    <div className="bg-indigo-500/30 px-3 py-1 rounded-lg border border-indigo-400/20">
                                        <span className="text-[10px] uppercase font-bold text-indigo-100 block">Today</span>
                                        <span className="text-sm font-black">{formatCurrency(finStats.today.total)}</span>
                                    </div>
                                    <div className="bg-indigo-500/30 px-3 py-1 rounded-lg border border-indigo-400/20">
                                        <span className="text-[10px] uppercase font-bold text-indigo-100 block">This Month</span>
                                        <span className="text-sm font-black">{formatCurrency(finStats.month.total)}</span>
                                    </div>
                                </div>
                            </div>
                            <a href="/laboratory/expenses" className="btn btn-white text-indigo-600 font-black shadow-xl" style={{ borderRadius: '14px' }}>
                                Full Financial Audit
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Submit Report Modal
───────────────────────────────────────────────────────────── */
const SubmitReportModal = ({ test, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState(test.paymentAmount || '');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef();
    const isReplace = !!test.reportPDF;

    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!allowedTypes.includes(f.type)) {
            setError('Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG.');
            setFile(null);
        } else {
            setError('');
            setFile(f);
        }
        e.target.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { setError('Please select a report file.'); return; }

        setUploading(true);
        setError('');
        try {
            await laboratoryAPI.uploadReport(test._id, file, paymentAmount);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="lab-modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
            <div className="lab-modal" onClick={e => e.stopPropagation()} style={{ borderRadius: '32px', border: 'none', shadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <div className="lab-modal-header bg-gray-50/80 backdrop-blur-md p-xl border-b border-gray-100 flex justify-between items-center" style={{ borderRadius: '32px 32px 0 0' }}>
                    <div>
                        <h2 className="m-0 text-2xl font-black text-gray-900">{isReplace ? '🔄 Replace Report' : '📎 Document Transmission'}</h2>
                        <p className="text-gray-400 text-sm font-medium mt-1 uppercase tracking-tight">Finalizing Clinical Records for Patient</p>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-xl">
                    <div className="grid grid-2 gap-lg mb-xl bg-blue-50/50 p-lg rounded-2xl border border-blue-100/50">
                        <div>
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">PATIENT IDENTITY</label>
                            <div className="font-bold text-gray-900">{test.patientId?.fullName || 'N/A'}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">CLINICAL TEST</label>
                            <div className="font-bold text-gray-900">{test.testName}</div>
                        </div>
                    </div>

                    {isReplace && (
                        <div className="m-badge m-badge-yellow w-full py-3 text-center mb-xl font-bold">
                            ⚠️ NOTICE: NEW TRANSMISSION WILL OVERWRITE PREVIOUS RECORDS
                        </div>
                    )}

                    <div className="mb-xl">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">FILE TRANSMISSION <span className="text-red-500">*</span></label>
                        <div
                            className={`lab-file-drop p-2xl text-center border-2 border-dashed rounded-3xl transition-all cursor-pointer ${file ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {file ? (
                                <div>
                                    <div className="text-4xl mb-md">📄</div>
                                    <div className="font-black text-green-700">{file.name}</div>
                                    <div className="text-xs text-green-500 font-bold uppercase mt-1">Ready for upload ({(file.size / 1024).toFixed(1)} KB)</div>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-4xl mb-md">⬆️</div>
                                    <p className="text-gray-700 font-black m-0">Drag clinical report or click to browse</p>
                                    <small className="text-gray-400 font-medium mt-2 block">Standard Diagnostic Formats (PDF, DOCX, JPG)</small>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="mb-xl">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">BILLING AMOUNT (₹)</label>
                        <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">₹</span>
                             <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="input pl-10 h-14 text-xl font-black"
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                placeholder="0.00"
                                style={{ borderRadius: '16px' }}
                            />
                        </div>
                        <small className="text-gray-400 font-medium mt-2 block">This amount will be logged for financial audit purposes.</small>
                    </div>

                    {error && <div className="m-badge m-badge-red w-full py-3 text-center mb-xl">{error}</div>}

                    <div className="flex gap-md mt-2xl">
                        <button type="button" className="btn btn-outline-secondary h-12 px-xl" onClick={onClose} disabled={uploading} style={{ borderRadius: '14px' }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary flex-1 h-12 shadow-xl" disabled={uploading} style={{ borderRadius: '14px' }}>
                            {uploading ? '⏳ TRANSMITTING...' : isReplace ? 'FINALIZE REPLACEMENT' : 'FINALIZE SUBMISSION'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Dispute Modal (Lab Side — view & resolve)
───────────────────────────────────────────────────────────── */
const DisputeModal = ({ test, onClose, onResolved }) => {
    const [note, setNote] = useState('');
    const [resolving, setResolving] = useState(false);
    const [error, setError] = useState('');

    const dispute = test.reportDispute;

    const handleResolve = async () => {
        setResolving(true);
        setError('');
        try {
            await laboratoryAPI.resolveDispute(test._id, note);
            onResolved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resolve dispute.');
        } finally {
            setResolving(false);
        }
    };

    return (
        <div className="lab-modal-overlay" onClick={onClose} style={{ zIndex: 1001 }}>
            <div className="lab-modal lab-modal-sm" onClick={e => e.stopPropagation()} style={{ borderRadius: '32px', border: 'none', shadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <div className="lab-modal-header bg-red-50 p-xl flex justify-between items-center" style={{ borderRadius: '32px 32px 0 0' }}>
                    <div>
                        <h2 className="m-0 text-2xl font-black text-red-600">⚠️ Case Dispute</h2>
                        <p className="text-red-400 text-sm font-bold uppercase tracking-widest mt-1">Patient Issue Investigation</p>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors" onClick={onClose}>✕</button>
                </div>
                <div className="p-xl">
                    <div className="bg-gray-50 rounded-2xl p-lg space-y-md mb-xl">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PATIENT</span>
                            <span className="font-bold text-gray-900">{test.patientId?.fullName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TEST IDENTITY</span>
                            <span className="font-bold text-gray-900">{test.testName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">REPORT TIMESTAMP</span>
                            <span className="font-bold text-gray-900">{new Date(dispute.raisedAt).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="mb-xl">
                        <label className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-2">PATIENT'S OBSERVATION</label>
                        <div className="p-lg bg-red-50/50 rounded-2xl border border-red-100 text-red-900 font-bold leading-relaxed">{dispute.message}</div>
                    </div>

                    {dispute.status === 'open' && (
                        <div className="mb-xl">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">RESOLUTION FINAL NOTE</label>
                            <textarea
                                className="input w-full p-lg"
                                style={{ height: '120px', borderRadius: '16px' }}
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Describe how the issue was addressed (e.g. Specimen re-verified and report corrected)."
                            />
                        </div>
                    )}

                    {dispute.status === 'resolved' && (
                        <div className="m-badge m-badge-green w-full py-4 text-center flex flex-col items-center gap-1">
                            <div className="font-black">CASE RESOLVED</div>
                            <div className="text-[9px] font-bold uppercase">{new Date(dispute.resolvedAt).toLocaleString()}</div>
                            {dispute.resolutionNote && <p className="mt-2 text-xs opacity-90">{dispute.resolutionNote}</p>}
                        </div>
                    )}

                    {error && <div className="m-badge m-badge-red w-full py-3 text-center mb-xl">{error}</div>}

                    <div className="flex gap-md mt-xl">
                        <button className="btn btn-outline-secondary flex-1 h-12" onClick={onClose} style={{ borderRadius: '14px' }}>Close Case</button>
                        {dispute.status === 'open' && (
                            <button className="btn btn-success flex-1 h-12 shadow-lg" onClick={handleResolve} disabled={resolving} style={{ borderRadius: '14px' }}>
                                {resolving ? 'RESOLVING...' : 'MARK AS RESOLVED'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Test Requests
───────────────────────────────────────────────────────────── */
const TestRequests = () => {
    const [tests, setTests] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitModalTest, setSubmitModalTest] = useState(null); // test object for submit/replace modal
    const [disputeModalTest, setDisputeModalTest] = useState(null); // test object for dispute modal
    const [deletingId, setDeletingId] = useState(null);
    const [globalError, setGlobalError] = useState('');

    const fetchTests = () => {
        setLoading(true);
        laboratoryAPI.getLabTests(filter || undefined)
            .then(res => setTests(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTests();
    }, [filter]);

    const handleStatusUpdate = async (id, status) => {
        try {
            await laboratoryAPI.updateLabTestStatus(id, { status });
            fetchTests();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteReport = async (test) => {
        if (!window.confirm(`Delete the report for "${test.testName}"? This will revert status to In Progress and the patient will not see any report.`)) return;
        setDeletingId(test._id);
        setGlobalError('');
        try {
            await laboratoryAPI.deleteReport(test._id);
            fetchTests();
        } catch (err) {
            setGlobalError(err.response?.data?.message || 'Failed to delete report.');
        } finally {
            setDeletingId(null);
        }
    };

    const statusBadgeClass = (status) => {
        if (status === 'completed' || status === 'delivered') return 'm-badge-green';
        if (status === 'in-progress') return 'm-badge-blue';
        if (status === 'sample-collected') return 'm-badge-indigo';
        return 'm-badge-yellow';
    };

    const canUpload = (status) => ['requested', 'sample-collected', 'in-progress', 'completed'].includes(status);

    return (
        <div className="test-requests-view">
            <div className="flex justify-between items-center mb-xl">
                <div>
                    <h1 className="m-0 text-3xl font-black text-gray-900">Diagnostic Pipeline</h1>
                    <p className="text-gray-500 font-medium">Verify specimens and finalize clinical reports.</p>
                </div>
                <div className="flex gap-md items-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Workflow State:</span>
                    <select className="input shadow-sm" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto', minWidth: '200px', borderRadius: '12px' }}>
                        <option value="">Full Global Pipeline</option>
                        <option value="requested">Awaiting Collection</option>
                        <option value="sample-collected">Specimen Received</option>
                        <option value="in-progress">In Analysis</option>
                        <option value="completed">Finalized Reports</option>
                    </select>
                </div>
            </div>

            {globalError && <div className="m-badge m-badge-red w-full py-4 text-center mb-lg">{globalError}</div>}

            {loading ? <div className="spinner-sm mx-auto"></div> : (
                <div className="medical-ledger-container shadow-xl" style={{ borderRadius: '24px' }}>
                    <div className="medical-ledger-header border-none bg-gray-50/50">
                        <h3>Clinical Specimen Ledger</h3>
                        <div className="flex gap-2">
                             <div className="m-badge m-badge-blue">{tests.length} Active Jobs</div>
                        </div>
                    </div>
                    {tests.length === 0 ? (
                        <div className="py-2xl text-center">
                            <div className="text-5xl mb-md">🧬</div>
                            <p className="text-gray-400 font-medium">The diagnostic pipeline is clear for this filter.</p>
                        </div>
                    ) : (
                    <>
                    <div className="table-responsive">
                        <table className="medical-ledger-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '2rem' }}>Diagnostic Identity</th>
                                    <th>Patient Meta</th>
                                    <th>Ordering Unit</th>
                                    <th className="mobile-hide">Log Date</th>
                                    <th>Status</th>
                                    <th>Revenue</th>
                                    <th className="mobile-hide">Documentation</th>
                                    <th className="text-center" style={{ paddingRight: '2rem' }}>Audit Control</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tests.map((test) => {
                                    const hasOpenDispute = test.reportDispute?.status === 'open';
                                    const isDeleting = deletingId === test._id;

                                    return (
                                        <tr key={test._id} className={hasOpenDispute ? 'bg-red-50/30' : ''}>
                                            <td style={{ paddingLeft: '2rem' }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">🧪</div>
                                                    <div>
                                                        <div className="font-black text-gray-900 text-sm">{test.testName}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{test.testCategory || 'General Diagnostics'}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="font-bold text-gray-800">{test.patientId?.fullName || '—'}</div>
                                                <div className="text-[10px] text-indigo-500 font-bold uppercase">{test.patientId?.mobile || 'ID: ' + test.patientId?._id?.slice(-8)}</div>
                                            </td>

                                            <td>
                                                <div className="text-xs font-black text-gray-500 uppercase">Dr. {test.doctorId?.fullName || 'Hospital System'}</div>
                                            </td>

                                            <td className="mobile-hide">
                                                <div className="text-xs font-bold text-gray-400">
                                                    {new Date(test.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                                </div>
                                            </td>

                                            <td>
                                                <span className={`m-badge ${statusBadgeClass(test.status)}`}>
                                                    {test.status.replace('-', ' ').toUpperCase()}
                                                </span>
                                            </td>

                                            <td>
                                                {test.paymentAmount != null
                                                    ? <span className="font-black text-gray-900">₹{test.paymentAmount.toLocaleString()}</span>
                                                    : <span className="text-gray-300 font-bold">N/A</span>
                                                }
                                            </td>

                                            <td className="mobile-hide">
                                                <div className="flex flex-col gap-1">
                                                    {test.reportPDF ? (
                                                        <>
                                                            <a
                                                                href={`http://localhost:5000/${(test.reportPDF || '').replace(/\\/g, '/')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-sm btn-link text-blue-600 font-black flex items-center gap-1 p-0"
                                                            >
                                                                <span className="text-base text-blue-500">📄</span> DOWNLOAD REPORT
                                                            </a>
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-gray-300 uppercase">Awaiting File</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td style={{ paddingRight: '2rem' }}>
                                                <div className="flex justify-center gap-2">
                                                    {test.status === 'requested' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(test._id, 'sample-collected')}
                                                            className="btn btn-sm btn-primary px-4 shadow-md"
                                                            style={{ borderRadius: '10px' }}
                                                        >
                                                            Collect
                                                        </button>
                                                    )}

                                                    {test.status === 'sample-collected' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(test._id, 'in-progress')}
                                                            className="btn btn-sm btn-info px-4 shadow-md"
                                                            style={{ borderRadius: '10px' }}
                                                        >
                                                            Analyze
                                                        </button>
                                                    )}

                                                    {canUpload(test.status) && (
                                                        <button
                                                            className={`btn btn-sm ${test.reportPDF ? 'btn-outline-primary' : 'btn-success shadow-md'} px-4`}
                                                            style={{ borderRadius: '10px' }}
                                                            onClick={() => setSubmitModalTest(test)}
                                                        >
                                                            {test.reportPDF ? 'Replace' : 'Submit'}
                                                        </button>
                                                    )}

                                                    {test.reportPDF && (
                                                        <button
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                                                            onClick={() => handleDeleteReport(test)}
                                                            disabled={isDeleting}
                                                        >
                                                            {isDeleting ? '...' : '🗑️'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card Layout */}
                    <div className="lab-mobile-cards">
                        {tests.map(test => {
                            const hasOpenDispute = test.reportDispute?.status === 'open';
                            const isDeleting = deletingId === test._id;
                            
                            return (
                                <div key={test._id} className={`lab-mobile-card ${hasOpenDispute ? 'dispute-raised' : ''}`}>
                                    <div className="lab-mobile-card-header">
                                        <div>
                                            <div className="font-black text-gray-900">{test.testName}</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">{test.testCategory || 'General Diagnostics'}</div>
                                        </div>
                                        <span className={`m-badge ${statusBadgeClass(test.status)}`}>
                                            {test.status.replace('-', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    
                                    <div className="lab-mobile-card-body">
                                        <div className="lab-mobile-card-info-item">
                                            <label className="lab-mobile-card-label">Patient</label>
                                            <div className="lab-mobile-card-value">{test.patientId?.fullName}</div>
                                        </div>
                                        <div className="lab-mobile-card-info-item">
                                            <label className="lab-mobile-card-label">Doctor</label>
                                            <div className="lab-mobile-card-value">Dr. {test.doctorId?.fullName?.split(' ').slice(-1)[0]}</div>
                                        </div>
                                        <div className="lab-mobile-card-info-item">
                                            <label className="lab-mobile-card-label">Revenue</label>
                                            <div className="lab-mobile-card-value">₹{test.paymentAmount || 0}</div>
                                        </div>
                                        <div className="lab-mobile-card-info-item">
                                            <label className="lab-mobile-card-label">Date</label>
                                            <div className="lab-mobile-card-value">{new Date(test.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="lab-mobile-card-actions">
                                        {test.status === 'requested' && (
                                            <button onClick={() => handleStatusUpdate(test._id, 'sample-collected')} className="btn btn-sm btn-primary">Collect</button>
                                        )}
                                        {test.status === 'sample-collected' && (
                                            <button onClick={() => handleStatusUpdate(test._id, 'in-progress')} className="btn btn-sm btn-info">Analyze</button>
                                        )}
                                        {canUpload(test.status) && (
                                            <button onClick={() => setSubmitModalTest(test)} className={`btn btn-sm ${test.reportPDF ? 'btn-outline-primary' : 'btn-success'}`}>
                                                {test.reportPDF ? 'Replace' : 'Submit'}
                                            </button>
                                        )}
                                        {test.reportPDF && (
                                            <>
                                                <a href={`http://localhost:5000/${(test.reportPDF || '').replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info">📄 Report</a>
                                                <button onClick={() => handleDeleteReport(test)} disabled={isDeleting} className="btn btn-sm btn-outline-danger">🗑️ Delete</button>
                                            </>
                                        )}
                                        {hasOpenDispute && (
                                            <button onClick={() => setDisputeModalTest(test)} className="btn btn-sm btn-danger w-full mt-2">⚠️ Resolve Dispute</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    </>
                    )}

                </div>
            )}

            {/* Submit / Replace Report Modal */}
            {submitModalTest && (
                <SubmitReportModal
                    test={submitModalTest}
                    onClose={() => setSubmitModalTest(null)}
                    onSuccess={fetchTests}
                />
            )}

            {/* Dispute Modal */}
            {disputeModalTest && (
                <DisputeModal
                    test={disputeModalTest}
                    onClose={() => setDisputeModalTest(null)}
                    onResolved={fetchTests}
                />
            )}
        </div>
    );
};

export default LaboratoryDashboard;
