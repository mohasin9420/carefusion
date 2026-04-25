import { useState, useEffect, useRef } from 'react';
import { diagnosticTestAPI } from '../../services/api';
import './MedicineAutocomplete.css'; // Reusing styles

const DiagnosticTestAutocomplete = ({ onSelect, placeholder = "Search lab test (e.g. CBC, SGPT)...", clearOnSelect = true }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [error, setError] = useState('');
    const wrapperRef = useRef(null);
    const debounceTimer = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchTests = async (searchQuery) => {
        if (searchQuery.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await diagnosticTestAPI.searchTests(searchQuery);
            if (response.data.success) {
                setSuggestions(response.data.data);
                setShowSuggestions(true);
                setFocusedIndex(-1);
            }
        } catch (err) {
            console.error('Test search error:', err);
            setError('Search unavailable.');
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => searchTests(value), 300);
    };

    const handleSelect = (test) => {
        if (clearOnSelect) {
            setQuery('');
        } else {
            setQuery(test.name);
        }
        setSuggestions([]);
        setShowSuggestions(false);
        setFocusedIndex(-1);
        onSelect(test);
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0 && suggestions[focusedIndex]) {
                    handleSelect(suggestions[focusedIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setFocusedIndex(-1);
                break;
            default:
                break;
        }
    };

    return (
        <div className="medicine-autocomplete" ref={wrapperRef}>
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                placeholder={placeholder}
                autoComplete="off"
            />
            {loading && <div className="loading-indicator" />}
            {showSuggestions && (
                <div className="suggestions-dropdown">
                    {suggestions.length > 0 ? (
                        suggestions.map((test, index) => (
                            <div
                                key={test._id}
                                className={`suggestion-item ${index === focusedIndex ? 'focused' : ''}`}
                                onClick={() => handleSelect(test)}
                                onMouseEnter={() => setFocusedIndex(index)}
                            >
                                <div className="medicine-name">{test.name}</div>
                                <div className="medicine-details">
                                    <span className="badge badge-manufacturer">🔬 {test.category}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-suggestions">No tests found for "{query}"</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DiagnosticTestAutocomplete;
