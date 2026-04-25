import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './MedicineAutocomplete.css';

const MedicineAutocomplete = ({ onSelect, placeholder = "Search medicine...", clearOnSelect = true }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [error, setError] = useState('');
    const wrapperRef = useRef(null);
    const debounceTimer = useRef(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search function
    const searchMedicines = async (searchQuery) => {
        if (searchQuery.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = sessionStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/medicines/search?q=${encodeURIComponent(searchQuery)}&limit=10`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000 // Increased timeout to wait for MongoDB fallback
                }
            );

            if (response.data.success) {
                setSuggestions(response.data.data);
                setShowSuggestions(true);
                setFocusedIndex(-1);

                // Log fallback usage without alarming the user
                if (response.data.fallback) {
                    console.info('Using MongoDB search (Typesense unavailable)');
                }
            }
        } catch (err) {
            console.error('Medicine search error:', err);

            // Only show error for critical failures
            if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
                setError('Cannot connect to server. Please check your connection.');
            } else if (err.response?.status === 401) {
                setError('Session expired. Please login again.');
            } else if (err.response?.status >= 500) {
                setError('Server error. Please try again.');
            }
            // For other errors, don't show message as MongoDB fallback might be working

            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle input change with debouncing
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            searchMedicines(value);
        }, 300);
    };

    // Handle medicine selection
    const handleSelect = (medicine) => {
        if (clearOnSelect) {
            setQuery('');
        } else {
            setQuery(medicine.name);
        }
        setSuggestions([]);
        setShowSuggestions(false);
        setFocusedIndex(-1);
        onSelect(medicine);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
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

    // Helper to highlight matching text
    const highlightMatch = (text, term) => {
        if (!term) return text;
        const parts = text.split(new RegExp(`(${term})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === term.toLowerCase() ? (
                        <span key={i} className="highlight">{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
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

            {query && !loading && (
                <button className="clear-btn" onClick={() => setQuery('')} type="button">
                    ×
                </button>
            )}

            {loading && <div className="loading-indicator" />}

            {showSuggestions && (
                <div className="suggestions-dropdown">
                    {suggestions.length > 0 ? (
                        suggestions.map((medicine, index) => (
                            <div
                                key={medicine._id}
                                className={`suggestion-item ${index === focusedIndex ? 'focused' : ''}`}
                                onClick={() => handleSelect(medicine)}
                                onMouseEnter={() => setFocusedIndex(index)}
                            >
                                <div className="medicine-name">
                                    {highlightMatch(medicine.name, query)}
                                </div>
                                <div className="medicine-details">
                                    {medicine.manufacturer && (
                                        <span className="badge badge-manufacturer">
                                            🏢 {medicine.manufacturer}
                                        </span>
                                    )}
                                    {medicine.price && (
                                        <span className="badge badge-price">
                                            ₹{medicine.price}
                                        </span>
                                    )}
                                    {medicine.saltComposition && (
                                        <span className="badge badge-salt" title={medicine.saltComposition}>
                                            🧪 {medicine.saltComposition}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-suggestions">
                            <p>No medicines found for "{query}"</p>
                            <small>Try a different keyword or check spelling</small>
                        </div>
                    )}
                </div>
            )}

            {error && <div className="error-message">⚠️ {error}</div>}
        </div>
    );
};

export default MedicineAutocomplete;
