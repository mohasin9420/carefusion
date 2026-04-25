import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './ClaimVerification.css';

const ClaimVerification = () => {
    const { ref: urlRef } = useParams();
    const [searchParams] = useSearchParams();
    const [ref, setRef] = useState(urlRef || searchParams.get('ref') || '');
    const [claimData, setClaimData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (urlRef) {
            handleVerify(urlRef);
        } else if (searchParams.get('ref')) {
            handleVerify(searchParams.get('ref'));
        }
    }, [urlRef, searchParams]);

    const handleVerify = async (reference) => {
        const verifyRef = reference || ref;
        if (!verifyRef) return;

        setLoading(true);
        setError('');
        setClaimData(null);

        try {
            const response = await axios.get(`http://localhost:5000/api/public/verify-claim/${verifyRef}`);
            setClaimData(response.data.claim);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid reference or claim not found.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="verify-page-container">
            <div className="verify-card">
                <div className="verify-header">
                    <div className="logo-section">
                        <span className="logo-icon">🛡️</span>
                        <h1>CareFusion Hospital</h1>
                    </div>
                    <p>Insurance Claim Verification Portal</p>
                </div>

                <div className="verify-form">
                    <label>Enter Claim Reference Number</label>
                    <div className="search-box">
                        <input 
                            type="text" 
                            placeholder="e.g. CLM-20240324-XXXX" 
                            value={ref} 
                            onChange={(e) => setRef(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                        />
                        <button onClick={() => handleVerify()} disabled={loading}>
                            {loading ? '...' : 'Verify'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="verify-error">
                        <span className="error-icon">❌</span>
                        <p>{error}</p>
                    </div>
                )}

                {claimData && (
                    <div className="verify-result">
                        <div className="success-banner">
                            <span className="success-icon">✅</span>
                            <h3>Claim Verified Successfully</h3>
                        </div>

                        <div className="result-grid">
                            <div className="result-item">
                                <label>Reference</label>
                                <p className="ref-text">{claimData.reference}</p>
                            </div>
                            <div className="result-item">
                                <label>Patient Name</label>
                                <p>{claimData.patientName}</p>
                            </div>
                            <div className="result-item">
                                <label>Treating Doctor</label>
                                <p>Dr. {claimData.doctorName}</p>
                            </div>
                            <div className="result-item">
                                <label>Visit Date</label>
                                <p>{new Date(claimData.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="result-item">
                                <label>Status</label>
                                <span className={`status-badge ${claimData.status}`}>
                                    {claimData.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="result-item">
                                <label>Insurance Provider</label>
                                <p>{claimData.insuranceProvider}</p>
                            </div>
                        </div>

                        <div className="verification-footer">
                            <p>Verified by CareFusion HMS · {new Date(claimData.verifiedAt).toLocaleString()}</p>
                            <div className="hospital-stamp">
                                OFFICIAL RECORD
                            </div>
                        </div>
                    </div>
                )}

                {!claimData && !loading && !error && (
                    <div className="verify-info">
                        <p>Verify the authenticity of digital medical records and insurance claims issued by CareFusion Hospital.</p>
                    </div>
                )}
            </div>
            
            <footer className="portal-footer">
                 &copy; {new Date().getFullYear()} CareFusion Hospital System. All Rights Reserved.
            </footer>
        </div>
    );
};

export default ClaimVerification;
