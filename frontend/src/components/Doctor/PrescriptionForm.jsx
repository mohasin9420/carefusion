import { useState, useEffect } from 'react';
import MedicineAutocomplete from './MedicineAutocomplete';
import DiagnosticTestAutocomplete from './DiagnosticTestAutocomplete';
import { appointmentAPI } from '../../services/api';
import './PrescriptionForm.css';

const PrescriptionForm = ({ appointment, onSubmit, onCancel, initialLabTests = [], onLabTestsChange, consultationMode = 'quick' }) => {
    // Basic clinical data
    const [diagnosis, setDiagnosis] = useState(appointment.initialDiagnosis || '');
    const [diseaseType, setDiseaseType] = useState(appointment.diseaseType || '');
    const [severity, setSeverity] = useState(appointment.severity || '');
    const [symptoms, setSymptoms] = useState(appointment.symptoms || '');
    const [notes, setNotes] = useState('');
    
    // Items lists
    const [medicines, setMedicines] = useState([]);
    const [labTests, setLabTests] = useState(initialLabTests);
    
    // Recommendations state
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [recSource, setRecSource] = useState('');
    const [cautionNotes, setCautionNotes] = useState('');

    // Medicine input state
    const [currentMedicine, setCurrentMedicine] = useState(null);
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');
    const [timing, setTiming] = useState('After Meal');
    const [errors, setErrors] = useState({});

    // Fetch recommendations when diagnosis/metadata changes
    useEffect(() => {
        if (diagnosis && diagnosis.length > 2) {
            const timer = setTimeout(() => {
                fetchRecommendations();
            }, 600);
            return () => clearTimeout(timer);
        } else {
            setRecommendations([]);
            setRecSource('');
            setCautionNotes('');
        }
    }, [diagnosis, diseaseType, severity, consultationMode]);

    const fetchRecommendations = async () => {
        setLoadingRecs(true);
        try {
            const res = await appointmentAPI.getSmartRecommendations({
                diseaseName: diagnosis,
                diseaseType,
                severity,
                symptoms
            });
            setRecommendations(res.data.recommendations || []);
            setRecSource(res.data.source);
            setCautionNotes(res.data.cautionNotes || '');
        } catch (err) {
            console.error('Failed to fetch recommendations:', err);
        } finally {
            setLoadingRecs(false);
        }
    };

    const handleMedicineSelect = (medicine) => {
        setCurrentMedicine(medicine);
        setErrors({ ...errors, medicine: '' });
    };

    const handleAddMedicine = () => {
        const newErrors = {};
        if (!currentMedicine) newErrors.medicine = 'Select a medicine first';
        if (!dosage.trim()) newErrors.dosage = 'Req.';
        if (!frequency.trim()) newErrors.frequency = 'Req.';
        if (!duration.trim()) newErrors.duration = 'Req.';

        if (Object.keys(newErrors).length > 0) {
            setErrors({ ...errors, ...newErrors });
            return;
        }

        const medicineEntry = {
            id: currentMedicine._id,
            name: currentMedicine.name,
            manufacturer: currentMedicine.manufacturer,
            saltComposition: currentMedicine.saltComposition,
            price: currentMedicine.price,
            dosage,
            frequency,
            duration,
            timing
        };

        setMedicines([...medicines, medicineEntry]);
        setCurrentMedicine(null);
        setErrors({});
    };

    const handleFillStandard = () => {
        setDosage('1 tablet');
        setFrequency('3 times daily');
        setDuration('5 days');
        setErrors({ ...errors, dosage: '', frequency: '', duration: '' });
    };

    const applyRecommendation = (rec) => {
        const medicineEntry = {
            id: null,
            name: rec.name,
            manufacturer: 'Suggested',
            saltComposition: '',
            price: 0,
            dosage: rec.dosage,
            frequency: rec.frequency,
            duration: rec.duration,
            timing: 'After Meal', // Default for recommendations
            isSuggested: true
        };
        setMedicines([...medicines, medicineEntry]);
    };

    const handleRemoveMedicine = (index) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const handleAddTest = (test) => {
        if (!labTests.find(t => t._id === test._id)) {
            const updated = [...labTests, test];
            setLabTests(updated);
            if (onLabTestsChange) onLabTestsChange(updated);
        }
    };

    const handleRemoveTest = (index) => {
        const updated = labTests.filter((_, i) => i !== index);
        setLabTests(updated);
        if (onLabTestsChange) onLabTestsChange(updated);
    };

    const handleSubmit = () => {
        const newErrors = {};
        if (!diagnosis.trim()) newErrors.diagnosis = 'Diagnosis is required';
        if (medicines.length === 0) newErrors.medicines = 'Add at least one medicine';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const isValidObjectId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id.toString());

        const prescriptionData = {
            appointmentId: appointment._id,
            patientId: appointment.patientId?._id || appointment.patient,
            diagnosis,
            notes,
            medicines: medicines.map(m => ({
                medicineId: m.id,
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration,
                timing: m.timing
            })),
            labTestsRequested: labTests.map(t => {
                const testData = { name: t.name };
                if (isValidObjectId(t._id)) {
                    testData.testId = t._id;
                }
                return testData;
            })
        };

        onSubmit(prescriptionData);
    };

    return (
        <div className="prescription-form">
            <div className="prescription-container">
                {/* Left Side: Clinical Diagnosis */}
                <div className="form-section">
                    <div className="section-title">
                        <i>📝</i>
                        <span>Clinical Diagnosis</span>
                    </div>

                    <div className="diagnosis-metadata-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Diagnosis / Disease Name *</label>
                            <input
                                className="input"
                                type="text"
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                                placeholder="e.g. Fever, Diabetes"
                            />
                            {errors.diagnosis && <div className="validation-msg">⚠️ {errors.diagnosis}</div>}
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Severity</label>
                            <select className="input" value={severity} onChange={e => setSeverity(e.target.value)}>
                                <option value="">Select Severity</option>
                                <option value="Mild">Mild</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Severe">Severe</option>
                            </select>
                        </div>
                    </div>

                    {consultationMode === 'advanced' && (
                    <div className="diagnosis-metadata-row">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Disease Type / Category</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={diseaseType}
                                    onChange={(e) => setDiseaseType(e.target.value)}
                                    placeholder="e.g. Viral, Bacterial"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Key Symptoms</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    placeholder="e.g. Cough, Body pain"
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Instructions to Patient</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Advice on diet, rest, or follow-up..."
                            rows="2"
                        />
                    </div>

                    {/* Smart Recommendations Panel Integrated into Findings Section */}
                    {(recommendations.length > 0 || loadingRecs) && (
                        <div className="smart-panel" style={{ 
                            marginTop: '1.5rem', background: '#f8fafc', border: '1.5px dashed #cbd5e1',
                            padding: '1rem', borderRadius: '12px'
                        }}>
                            <div className="section-title" style={{ color: '#0f172a', marginBottom: '0.8rem', fontSize: '0.85rem' }}>
                                <i>💡</i>
                                <span>Smart Recommendations {recSource && <small style={{ fontWeight: 400, color: '#64748b' }}>({recSource})</small>}</span>
                                 {loadingRecs && <span className="spinner-small" style={{ marginLeft: '10px' }} />}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {recommendations.map((rec, idx) => (
                                    <div key={idx} className="rec-pill" style={{ 
                                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', 
                                        padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ fontSize: '12px' }}>
                                            <strong style={{ display: 'block', color: '#1e293b' }}>{rec.name}</strong>
                                            <span style={{ fontSize: '10px', color: '#64748b' }}>{rec.dosage} • {rec.frequency}</span>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => applyRecommendation(rec)}
                                            style={{ 
                                                background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '50%', 
                                                width: '20px', height: '20px', cursor: 'pointer', display: 'flex', 
                                                alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                                                padding: 0
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {cautionNotes && (
                                <div style={{ 
                                    marginTop: '12px', fontSize: '11px', color: '#b91c1c', background: '#fef2f2', 
                                    padding: '8px 12px', borderRadius: '8px', borderLeft: '4px solid #ef4444' 
                                }}>
                                    <strong>⚠️ Clinical Note:</strong> {cautionNotes}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side: Medicine Selection */}
                <div className="form-section">
                    <div className="section-title" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <i>💊</i>
                            <span>Prescribe Medicines</span>
                        </div>
                        <button
                            type="button"
                            className="btn-premium btn-outline"
                            style={{ padding: '4px 12px', fontSize: '12px' }}
                            onClick={handleFillStandard}
                        >
                            ⚡ Fill Standard
                        </button>
                    </div>

                    <div className="form-group">
                        <label>Search Master Database</label>
                        <MedicineAutocomplete
                            onSelect={handleMedicineSelect}
                            placeholder="Type medicine name..."
                        />
                    </div>

                    {currentMedicine && (
                        <div className="medicine-detail-card" style={{ marginBottom: '1rem' }}>
                            <div className="detail-header">
                                <h4>{currentMedicine.name}</h4>
                            </div>
                            <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                                <div><span style={{ color: '#64748b' }}>Salt: </span>{currentMedicine.saltComposition}</div>
                                <div><span style={{ color: '#64748b' }}>Maker: </span>{currentMedicine.manufacturer}</div>
                            </div>
                        </div>
                    )}

                    <div className="dosage-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Dosage</label>
                            <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="1 tab" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Freq.</label>
                            <input type="text" value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="3x/day" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Duration</label>
                            <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="5 days" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Timing</label>
                            <select className="input" value={timing} onChange={e => setTiming(e.target.value)} style={{ padding: '8px' }}>
                                <option value="After Meal">After Meal</option>
                                <option value="Before Meal">Before Meal</option>
                                <option value="Empty Stomach">Empty Stomach</option>
                                <option value="With Meal">With Meal</option>
                                <option value="Night">Before Sleep</option>
                            </select>
                        </div>
                        <button type="button" className="add-btn" onClick={handleAddMedicine} style={{ height: '40px' }}>
                            + Add
                        </button>
                    </div>
                    {errors.medicine && <div className="validation-msg">⚠️ {errors.medicine}</div>}
                    
                    <div className="medicines-list-section" style={{ marginTop: '1.5rem' }}>
                        <div className="section-title" style={{ fontSize: '0.9rem' }}>
                            <i>📜</i>
                            <span>Selected Medicines</span>
                        </div>

                        {medicines.length > 0 ? (
                            <div className="premium-table-container">
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Medicine</th>
                                            <th>Schedule</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {medicines.map((med, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <div className="med-name-cell">
                                                        <span className="med-main">{med.name}</span>
                                                        <span className="med-sub" style={{ fontSize: '10px' }}>{med.manufacturer}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '11px' }}>
                                                        <span className="badge-tag tag-dosage">{med.dosage}</span>
                                                        <span className="badge-tag tag-freq">{med.frequency}</span>
                                                        <span className="badge-tag tag-dur">{med.duration}</span>
                                                        <span className="badge-tag tag-timing">{med.timing}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button type="button" className="remove-action-btn" onClick={() => handleRemoveMedicine(index)}>❌</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-medicines" style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                                No medicines added.
                            </div>
                        )}
                        {errors.medicines && <div className="validation-msg">⚠️ {errors.medicines}</div>}
                    </div>
                </div>

                {/* Bottom: Lab Tests Section */}
                <div className="form-section" style={{ gridColumn: 'span 2', borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '1rem' }}>
                    <div className="section-title">
                        <i>🧪</i>
                        <span>Suggested Lab Tests</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div className="form-group">
                            <label>Search Master Test Database</label>
                            <DiagnosticTestAutocomplete onSelect={handleAddTest} />
                        </div>
                        {labTests.length > 0 && (
                            <div className="premium-table-container">
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Test Name</th>
                                            <th>Category</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {labTests.map((test, index) => (
                                            <tr key={index}>
                                                <td><span className="med-main">{test.name}</span></td>
                                                <td><span className="badge-tag tag-dosage">{test.category}</span></td>
                                                <td><button type="button" className="remove-action-btn" onClick={() => handleRemoveTest(index)}>❌</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="form-footer">
                <button type="button" className="btn-premium btn-outline" onClick={onCancel}>
                    Discard Changes
                </button>
                <button type="button" className="btn-premium btn-solid" onClick={handleSubmit}>
                    🚀 Sign & Issue Prescription
                </button>
            </div>
        </div>
    );
};

export default PrescriptionForm;
