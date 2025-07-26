import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchInput, SearchSuggestion } from './SearchInput';
import { useSearch } from '@hooks/useSearch';
import { File, Package, FileText, HelpCircle, Home, Info } from 'lucide-react';

interface SearchBarProps {
  variant?: 'default' | 'minimal' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  placeholder?: string;
  showTrending?: boolean;
  onSearch?: (query: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  page: <File className="w-4 h-4" />,
  product: <Package className="w-4 h-4" />,
  article: <FileText className="w-4 h-4" />,
  faq: <HelpCircle className="w-4 h-4" />,
  home: <Home className="w-4 h-4" />,
  about: <Info className="w-4 h-4" />,
};

export const SearchBar: React.FC<SearchBarProps> = ({
  variant = 'default',
  size = 'md',
  className,
  placeholder = 'Search products, pages, FAQs...',
  showTrending = true,
  onSearch,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const {
    suggestions,
    recentSearches,
    trendingSearches,
    loading,
    search,
    clearRecentSearches,
  } = useSearch();

  const handleSearch = useCallback((searchQuery: string) => {
    if (searchQuery.trim()) {
      search(searchQuery);
      if (onSearch) {
        onSearch(searchQuery);
      } else {
        // Default behavior - navigate to search results page
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  }, [search, onSearch, navigate]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.url) {
      if (suggestion.url.startsWith('http')) {
        window.location.href = suggestion.url;
      } else {
        navigate(suggestion.url);
      }
    } else {
      handleSearch(suggestion.title);
    }
  }, [navigate, handleSearch]);

  // Map search results to suggestions with icons
  const mappedSuggestions: SearchSuggestion[] = suggestions.map(suggestion => ({
    ...suggestion,
    icon: iconMap[suggestion.category || 'page'] || iconMap.page,
  }));

  return (
    <SearchInput
      value={query}
      onChange={setQuery}
      onSearch={handleSearch}
      onSuggestionClick={handleSuggestionClick}
      suggestions={mappedSuggestions}
      recentSearches={recentSearches}
      onClearRecent={clearRecentSearches}
      loading={loading}
      size={size}
      variant={variant}
      className={className}
      placeholder={placeholder}
      showTrending={showTrending}
      trendingSearches={trendingSearches}
    />
  );
};