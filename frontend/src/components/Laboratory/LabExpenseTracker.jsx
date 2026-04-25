import { useState, useEffect } from 'react';
import { laboratoryAPI } from '../../services/api';
import './LabExpenseTracker.css';

/* ─────────────────────────────────────────────────────────────
   Expense Tracker — Main Component
───────────────────────────────────────────────────────────── */
const LabExpenseTracker = () => {
    const [activeTab, setActiveTab] = useState('daily'); // daily | monthly | patients
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    // Month picker (for daily & patient views)
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

    useEffect(() => {
        laboratoryAPI.getExpenseSummary()
            .then(res => setSummary(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const formatCurrency = (n) =>
        `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="expense-root">
            <div className="flex justify-between items-end mb-xl">
                <div>
                    <h1 className="m-0 text-3xl font-black text-gray-900 tracking-tight">Financial Audit Slate</h1>
                    <p className="text-gray-500 font-medium">Real-time revenue tracking and clinical billing analysis.</p>
                </div>
                <div className="bg-white p-sm rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-sm font-bold text-gray-700">Financial Integrity: Verified</span>
                </div>
            </div>

            {/* Summary Cards */}
            {!loading && summary && (
                <div className="modern-stat-grid mb-xl">
                    <div className="modern-stat-card">
                        <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>💰</div>
                        <div className="stat-info">
                            <h3>Today's Collection</h3>
                            <div className="stat-value">{formatCurrency(summary.today.total)}</div>
                            <p className="text-xs text-green-600 font-bold mt-1 uppercase">{summary.today.count} Records Finalized</p>
                        </div>
                    </div>

                    <div className="modern-stat-card">
                        <div className="stat-icon-wrapper" style={{ background: '#f5f3ff', color: '#7c3aed' }}>📅</div>
                        <div className="stat-info">
                            <h3>Monthly Total</h3>
                            <div className="stat-value">{formatCurrency(summary.month.total)}</div>
                            <p className="text-xs text-indigo-500 font-bold mt-1 uppercase">{summary.month.count} Job Cycles</p>
                        </div>
                    </div>

                    <div className="modern-stat-card bg-slate-900 text-white">
                         <div className="stat-info">
                            <h3 className="text-slate-400">Lifetime Revenue</h3>
                            <div className="stat-value text-white">{formatCurrency(summary.allTime.total)}</div>
                            <p className="text-xs text-slate-500 font-bold mt-1 uppercase">{summary.allTime.count} Cumulative Records</p>
                        </div>
                        <div className="text-4xl opacity-20">📊</div>
                    </div>
                </div>
            )}

            {loading && <div className="spinner" />}

            {/* Tabs */}
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-xl w-fit">
                {[
                    { key: 'daily', label: 'Daily Breakdown', icon: '📅' },
                    { key: 'monthly', label: 'Monthly Trends', icon: '📈' },
                    { key: 'patients', label: 'Patient Audit', icon: '👥' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
                            activeTab === tab.key 
                            ? 'bg-white text-indigo-600 shadow-md' 
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Month Picker (for daily + patients) */}
            {(activeTab === 'daily' || activeTab === 'patients') && (
                <div className="flex items-center gap-4 mb-xl bg-white p-lg rounded-2xl border border-gray-100 shadow-sm w-fit">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Audit Month Selection:</label>
                    <input
                        type="month"
                        className="input font-bold border-none bg-gray-50"
                        value={selectedMonth}
                        max={currentMonthStr}
                        onChange={e => setSelectedMonth(e.target.value)}
                        style={{ height: '44px', borderRadius: '12px' }}
                    />
                </div>
            )}

            {/* Content */}
            <div className="expense-content">
                {activeTab === 'daily' && (
                    <DailyView month={selectedMonth} formatCurrency={formatCurrency} />
                )}
                {activeTab === 'monthly' && (
                    <MonthlyView formatCurrency={formatCurrency} />
                )}
                {activeTab === 'patients' && (
                    <PatientView month={selectedMonth} formatCurrency={formatCurrency} />
                )}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Daily View
───────────────────────────────────────────────────────────── */
const DailyView = ({ month, formatCurrency }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedDay, setExpandedDay] = useState(null);

    useEffect(() => {
        setLoading(true);
        laboratoryAPI.getDailyExpenses(month)
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [month]);

    if (loading) return <div className="spinner" />;
    if (!data || data.days.length === 0) {
        return <div className="expense-empty">No expense records found for the selected month.</div>;
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center p-xl bg-gray-50/50 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-xl">📆</span>
                    <span className="font-black text-sm uppercase tracking-wider">{data.days.length} Active Days in Period</span>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Period Aggregate</div>
                    <div className="text-2xl font-black text-emerald-600">{formatCurrency(data.grandTotal)}</div>
                </div>
            </div>

            <div className="divide-y divide-gray-50">
                {[...data.days].reverse().map(day => (
                    <div key={day.date} className="group transition-all hover:bg-white">
                        <div
                            className="flex justify-between items-center p-xl cursor-pointer"
                            onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-black text-indigo-500 leading-none mb-1">
                                        {new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                                    </span>
                                    <span className="text-sm font-black text-gray-900 leading-none">
                                        {new Date(day.date + 'T00:00:00').getDate()}
                                    </span>
                                </div>
                                <div>
                                    <div className="font-black text-gray-900">
                                        {new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                    </div>
                                    <div className="m-badge m-badge-blue text-[9px] mt-1">{day.count} CLINICAL JOBS</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-xl">
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Daily Yield</div>
                                    <div className="text-lg font-black text-gray-900">{formatCurrency(day.total)}</div>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${expandedDay === day.date ? 'bg-indigo-600 text-white rotate-180' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                                    ▼
                                </div>
                            </div>
                        </div>

                        {expandedDay === day.date && (
                            <div className="p-xl pt-0 animate-in slide-in-from-top-2 duration-300">
                                <div className="medical-ledger-container shadow-sm border border-gray-100" style={{ borderRadius: '16px' }}>
                                    <table className="medical-ledger-table">
                                        <thead>
                                            <tr>
                                                <th>Specimen/Test Identity</th>
                                                <th>Subject</th>
                                                <th>Timestamp</th>
                                                <th>Status</th>
                                                <th className="text-right">Billed Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {day.tests.map((t, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <div className="font-black text-gray-900 text-sm italic">"{t.testName}"</div>
                                                    </td>
                                                    <td>
                                                        <div className="font-bold text-gray-800">{t.patientName}</div>
                                                    </td>
                                                    <td>
                                                        <div className="text-xs font-bold text-gray-400 uppercase">
                                                            {new Date(t.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`m-badge ${t.status === 'completed' ? 'm-badge-green' : 'm-badge-blue'}`}>
                                                            {t.status?.replace(/-/g, ' ').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="text-right font-black text-emerald-600">{formatCurrency(t.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50/80">
                                            <tr>
                                                <td colSpan={4} className="text-right text-xs font-black text-gray-500 uppercase tracking-widest py-4">Total Daily Processing Value</td>
                                                <td className="text-right font-black text-lg text-emerald-600 py-4" style={{ paddingRight: '1rem' }}>{formatCurrency(day.total)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Monthly View
───────────────────────────────────────────────────────────── */
const MonthlyView = ({ formatCurrency }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        laboratoryAPI.getMonthlyExpenses()
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="spinner" />;
    if (!data || data.months.length === 0) {
        return <div className="expense-empty">No monthly expense records yet.</div>;
    }

    const maxTotal = Math.max(...data.months.map(m => m.total), 1);

    return (
        <div className="p-xl animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-2xl">
                <div>
                    <h3 className="m-0 text-2xl font-black text-gray-900">Revenue Velocity</h3>
                    <p className="text-gray-500 font-medium">Performance tracking across the last 12-month cycle.</p>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cumulative Value</div>
                    <div className="text-3xl font-black text-indigo-600">{formatCurrency(data.grandTotal)}</div>
                </div>
            </div>

            <div className="space-y-lg">
                {[...data.months].reverse().map(m => {
                    const barWidth = Math.max((m.total / maxTotal) * 100, 2);
                    return (
                        <div key={m.month} className="group hover:bg-gray-50/50 p-lg rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                            <div className="flex justify-between items-end mb-sm">
                                <div className="font-black text-gray-900">{m.label}</div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-emerald-600">{formatCurrency(m.total)}</div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{m.count} DIAGNOSTIC CYCLES</div>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 shadow-lg transition-all duration-1000 ease-out"
                                    style={{ width: `${barWidth}%`, borderRadius: '999px' }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Patient View
───────────────────────────────────────────────────────────── */
const PatientView = ({ month, formatCurrency }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedPatient, setExpandedPatient] = useState(null);

    useEffect(() => {
        setLoading(true);
        laboratoryAPI.getPatientExpenses(month)
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [month]);

    if (loading) return <div className="spinner" />;
    if (!data || data.patients.length === 0) {
        return <div className="expense-empty">No patient expense records found for this period.</div>;
    }

    return (
        <div className="animate-in fade-in duration-500">
             <div className="flex justify-between items-center p-xl bg-gray-50/50 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-xl">👥</span>
                    <span className="font-black text-sm uppercase tracking-wider">{data.totalPatients} Clinical Participant{data.totalPatients !== 1 ? 's' : ''} Identified</span>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grand Subject Collection</div>
                    <div className="text-2xl font-black text-emerald-600">{formatCurrency(data.grandTotal)}</div>
                </div>
            </div>

            <div className="divide-y divide-gray-50">
                {data.patients.map((p, idx) => {
                    const patientId = p._id?.toString();
                    const isExpanded = expandedPatient === patientId;

                    return (
                        <div key={patientId || idx} className="group transition-all hover:bg-white">
                            <div
                                className="flex justify-between items-center p-xl cursor-pointer"
                                onClick={() => setExpandedPatient(isExpanded ? null : patientId)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black">
                                        {(p.patientName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-black text-gray-900 text-lg leading-tight">{p.patientName || 'Anonymous Participant'}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                             <div className="text-[10px] text-gray-400 font-bold uppercase">{p.patientMobile ? `📞 ${p.patientMobile}` : 'No Linked Mobile'}</div>
                                             <span className="text-gray-200">|</span>
                                             <div className="m-badge m-badge-indigo text-[9px]">{p.testCount} JOBS</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-xl">
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Subject Yield</div>
                                        <div className="text-xl font-black text-gray-900">{formatCurrency(p.totalAmount)}</div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-600 text-white rotate-180' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                                        ▼
                                    </div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="p-xl pt-0 animate-in slide-in-from-top-2 duration-300">
                                    <div className="medical-ledger-container shadow-sm border border-gray-100" style={{ borderRadius: '16px' }}>
                                        <table className="medical-ledger-table">
                                            <thead>
                                                <tr>
                                                    <th>Diagnostic Identification</th>
                                                    <th>Processing Date</th>
                                                    <th>Standard State</th>
                                                    <th className="text-right">Item Billed Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {p.tests.map((t, i) => (
                                                    <tr key={i}>
                                                        <td>
                                                            <div className="font-black text-gray-900 text-sm">"{t.testName}"</div>
                                                        </td>
                                                        <td>
                                                            <div className="text-xs font-bold text-gray-400 uppercase">
                                                                {new Date(t.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`m-badge ${t.status === 'completed' ? 'm-badge-green' : 'm-badge-blue'}`}>
                                                                {t.status?.replace(/-/g, ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="text-right font-black text-emerald-600">{formatCurrency(t.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50/80">
                                                <tr>
                                                    <td colSpan={3} className="text-right text-xs font-black text-gray-500 uppercase tracking-widest py-4">Participant Cumulative Investment</td>
                                                    <td className="text-right font-black text-lg text-emerald-600 py-4" style={{ paddingRight: '1rem' }}>{formatCurrency(p.totalAmount)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LabExpenseTracker;
