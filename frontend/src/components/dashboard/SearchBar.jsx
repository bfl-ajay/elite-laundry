import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CloseIcon } from '../../assets/icons/laundry-icons';

const SearchBar = ({ 
  onSearchChange, 
  searchQuery = '', 
  placeholder = "Search by customer name or contact number...",
  loading = false,
  debounceMs = 300 
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Update local query when external searchQuery changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounced search effect
  useEffect(() => {
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      if (onSearchChange && localQuery !== searchQuery) {
        onSearchChange(localQuery);
      }
    }, debounceMs);

    // Cleanup timeout on unmount
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localQuery, onSearchChange, searchQuery, debounceMs]);

  const handleInputChange = useCallback((e) => {
    setLocalQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    if (onSearchChange) {
      onSearchChange('');
    }
    // Focus back to input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onSearchChange]);

  const handleKeyDown = useCallback((e) => {
    // Clear search on Escape key
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [handleClear]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Global keyboard shortcut to focus search (forward slash)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only if not typing in another input
        if (document.activeElement?.tagName !== 'INPUT' && 
            document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-md sm:max-w-lg">
      <div className={`
        relative flex items-center transition-all duration-200
        ${isFocused 
          ? 'ring-2 ring-blue-500 ring-opacity-50' 
          : 'ring-1 ring-gray-300 hover:ring-gray-400'
        }
        rounded-lg bg-white shadow-sm
      `}>
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className={`h-5 w-5 transition-colors duration-200 ${
              isFocused ? 'text-blue-500' : 'text-gray-400'
            }`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label="Search orders"
          role="searchbox"
          aria-describedby="search-help"
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-12 py-3 text-sm sm:text-base
            bg-transparent border-0 rounded-lg
            placeholder-gray-500 text-gray-900
            focus:outline-none focus:ring-0
            transition-all duration-200
          `}
          disabled={loading}
        />

        {/* Loading Spinner or Clear Button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {loading ? (
            <div 
              className="animate-spin h-5 w-5"
              aria-label="Searching..."
              role="status"
            >
              <svg 
                className="h-5 w-5 text-blue-500" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : localQuery ? (
            <button
              onClick={handleClear}
              className={`
                p-1 rounded-full transition-all duration-200
                hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                text-gray-400 hover:text-gray-600
              `}
              title="Clear search"
              aria-label="Clear search"
              type="button"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Search Results Count or Status */}
      {localQuery && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1">
          <div className="text-xs text-gray-500 px-3">
            Searching for "{localQuery}"...
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;