import React from 'react';
import './PatientProfileSummary.css';

const PatientProfileSummary = ({ summaryData, onClose }) => {
    if (!summaryData) return null;

    const { 
        overview, 
        clinicalInsights = [], 
        treatmentHistory = [], 
        criticalAlerts = [] 
    } = summaryData;

    return (
        <div className="profile-summary-overlay" onClick={onClose}>
            <div className="profile-summary-content" onClick={e => e.stopPropagation()}>
                <div className="summary-header">
                    <div className="header-icon">🤖</div>
                    <div className="header-text">
                        <h3>AI Clinical Dashboard</h3>
                        <p>Real-time synthesis of medical records & reports</p>
                    </div>
                    <button className="summary-close" onClick={onClose}>×</button>
                </div>

                <div className="summary-body">
                    {/* Overview Banner */}
                    <div className="dashboard-overview">
                        <p className="overview-text">{overview}</p>
                    </div>

                    <div className="dashboard-grid">
                        {/* Left Column: Clinical Insights (Lab Findings) */}
                        <div className="dashboard-col">
                            <h4 className="section-title">🔍 Clinical Insights & Metrics</h4>
                            <div className="insights-container">
                                {clinicalInsights.length > 0 ? (
                                    clinicalInsights.map((item, i) => (
                                        <div key={i} className="insight-card">
                                            <span className="insight-category">{item.category}</span>
                                            <p className="insight-finding">{item.finding}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-data">No specific lab insights available.</p>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Treatment History & Alerts */}
                        <div className="dashboard-col">
                            <h4 className="section-title">💊 Treatment History</h4>
                            <div className="history-timeline">
                                {treatmentHistory.length > 0 ? (
                                    treatmentHistory.map((event, i) => (
                                        <div key={i} className="history-event">
                                            <span className="event-date">{event.date}</span>
                                            <p className="event-desc">{event.event}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-data">No recent treatment history.</p>
                                )}
                            </div>

                            {criticalAlerts && criticalAlerts.length > 0 && (
                                <div className="dashboard-alerts">
                                    <h4 className="alert-title">⚠️ Critical Alerts</h4>
                                    <ul>
                                        {criticalAlerts.map((alert, i) => (
                                            <li key={i}>{alert}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="summary-footer">
                    <p>Verified clinical synthesis for physician decision support.</p>
                </div>
            </div>
        </div>
    );
};

export default PatientProfileSummary;
