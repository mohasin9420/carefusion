import { useState } from 'react';
import DiagnosticTestAutocomplete from './DiagnosticTestAutocomplete';
import './PrescriptionForm.css'; // Reusing layout styles

const DiagnosticTestForm = ({ selectedTests, onAddTest, onRemoveTest }) => {
    return (
        <div className="prescription-form">
            <div className="form-section" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                <div className="section-title">
                    <i>🧪</i>
                    <span>Diagnostic Test Requests</span>
                </div>

                <div className="form-group">
                    <label>Search Master Test Database</label>
                    <DiagnosticTestAutocomplete
                        onSelect={onAddTest}
                    />
                    <small style={{ color: '#64748b', marginTop: '5px', display: 'block' }}>
                        Start typing test name (e.g., CBC, Liver Function, TSH)
                    </small>
                </div>

                <div className="medicines-list-section" style={{ marginTop: '30px' }}>
                    <div className="section-title">
                        <i>📜</i>
                        <span>Selected Tests</span>
                    </div>

                    {selectedTests.length > 0 ? (
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
                                    {selectedTests.map((test, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="med-name-cell">
                                                    <span className="med-main">{test.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge-tag tag-dosage">{test.category}</span>
                                            </td>
                                            <td>
                                                <button
                                                    className="remove-action-btn"
                                                    onClick={() => onRemoveTest(index)}
                                                    title="Remove"
                                                >
                                                    ❌
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-medicines">
                            <i>🔬</i>
                            <p>No tests selected. Use search above to add lab tests.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiagnosticTestForm;
