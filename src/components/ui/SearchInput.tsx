import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useDebounce } from '@hooks/useDebounce';

export interface SearchSuggestion {
  id: string;
  title: string;
  description?: string;
  category?: string;
  url?: string;
  icon?: React.ReactNode;
  trending?: boolean;
}

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  onClearRecent?: () => void;
  loading?: boolean;
  autoFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'floating';
  className?: string;
  showTrending?: boolean;
  trendingSearches?: string[];
}

const sizeClasses = {
  sm: 'h-10 sm:h-9 text-sm pl-9 pr-3',
  md: 'h-11 sm:h-11 text-sm sm:text-base pl-10 sm:pl-11 pr-4',
  lg: 'h-12 sm:h-14 text-base sm:text-lg pl-12 sm:pl-14 pr-5',
};

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const variantClasses = {
  default: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
  minimal: 'bg-gray-100 dark:bg-gray-800 border-0',
  floating: 'bg-white dark:bg-gray-800 shadow-lg border-0',
};

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onSearch,
  onSuggestionClick,
  suggestions = [],
  recentSearches = [],
  onClearRecent,
  loading = false,
  autoFocus = false,
  size = 'md',
  variant = 'default',
  className,
  showTrending = false,
  trendingSearches = [],
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const debouncedValue = useDebounce(value, 300);

  const showDropdown = isFocused && (
    suggestions.length > 0 ||
    (value.length === 0 && (recentSearches.length > 0 || (showTrending && trendingSearches.length > 0)))
  );

  const allSuggestions = [
    ...suggestions,
    ...(value.length === 0 && showTrending
      ? trendingSearches.map((search, index) => ({
          id: `trending-${index}`,
          title: search,
          trending: true,
        }))
      : []),
  ];

  useEffect(() => {
    if (onChange && debouncedValue) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
        handleSuggestionClick(allSuggestions[selectedIndex]);
      } else {
        onSearch?.(value);
      }
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < allSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
      setIsFocused(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.url) {
      window.location.href = suggestion.url;
    } else {
      setInternalValue(suggestion.title);
      onChange?.(suggestion.title);
      onSuggestionClick?.(suggestion);
      onSearch?.(suggestion.title);
    }
    setIsFocused(false);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={clsx('relative', className)}>
      <div className="relative">
        {/* Search Icon or Loader */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 className={clsx(iconSizeClasses[size], 'animate-spin text-gray-400')} />
          ) : (
            <Search className={clsx(iconSizeClasses[size], 'text-gray-400')} />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={clsx(
            'w-full rounded-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            sizeClasses[size],
            variantClasses[variant],
            value && 'pr-10',
            className
          )}
        />

        {/* Clear Button */}
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Clear search"
          >
            <X className={clsx(iconSizeClasses[size], 'text-gray-400')} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Recent Searches */}
            {value.length === 0 && recentSearches.length > 0 && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Recent Searches
                  </p>
                  {onClearRecent && (
                    <button
                      onClick={onClearRecent}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInternalValue(search);
                        onChange?.(search);
                        onSearch?.(search);
                      }}
                      className="flex items-center gap-2 w-full p-2 text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {search}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {allSuggestions.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                {allSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={clsx(
                      'flex items-start gap-3 w-full p-3 text-left transition-colors',
                      selectedIndex === index
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    )}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {suggestion.icon || (
                        suggestion.trending ? (
                          <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        ) : (
                          <Search className="w-5 h-5 text-gray-400" />
                        )
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {suggestion.title}
                      </p>
                      {suggestion.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                          {suggestion.description}
                        </p>
                      )}
                      {suggestion.category && (
                        <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                          {suggestion.category}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};