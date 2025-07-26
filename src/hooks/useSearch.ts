import { useState, useEffect, useCallback } from 'react';
import { SearchSuggestion } from '@components/ui/SearchInput';

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

// Mock data for demonstration
const mockSearchData: SearchSuggestion[] = [
  {
    id: '1',
    title: 'Professional Services',
    description: 'Consulting, support, and implementation services',
    category: 'page',
    url: '/services',
  },
  {
    id: '2',
    title: 'Product Catalog',
    description: 'Browse our complete product lineup',
    category: 'product',
    url: '/products',
  },
  {
    id: '3',
    title: 'About Our Company',
    description: 'Learn more about our mission and values',
    category: 'about',
    url: '/about',
  },
  {
    id: '4',
    title: 'How to place an order?',
    description: 'Step-by-step guide to ordering',
    category: 'faq',
    url: '/faq#ordering',
  },
  {
    id: '5',
    title: 'Contact Support',
    description: 'Get help from our support team',
    category: 'page',
    url: '/contact',
  },
  {
    id: '6',
    title: 'Shipping Information',
    description: 'Delivery times and shipping costs',
    category: 'faq',
    url: '/faq#shipping',
  },
  {
    id: '7',
    title: 'Return Policy',
    description: 'Our 30-day return guarantee',
    category: 'faq',
    url: '/faq#returns',
  },
  {
    id: '8',
    title: 'Business Solutions',
    description: 'Enterprise and bulk ordering options',
    category: 'product',
    url: '/products/business',
  },
];

const trendingSearchesData = [
  'New arrivals',
  'Best sellers',
  'Customer support',
  'Shipping info',
  'Business solutions',
];

export interface UseSearchResult {
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  trendingSearches: string[];
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  clearRecentSearches: () => void;
  addRecentSearch: (search: string) => void;
}

export const useSearch = (): UseSearchResult => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearches = useCallback((searches: string[]) => {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
      setRecentSearches(searches);
    } catch (e) {
      console.error('Failed to save recent searches', e);
    }
  }, []);

  // Add a new recent search
  const addRecentSearch = useCallback((search: string) => {
    const trimmedSearch = search.trim();
    if (!trimmedSearch) return;

    const updated = [trimmedSearch, ...recentSearches.filter(s => s !== trimmedSearch)];
    const limited = updated.slice(0, MAX_RECENT_SEARCHES);
    saveRecentSearches(limited);
  }, [recentSearches, saveRecentSearches]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    saveRecentSearches([]);
  }, [saveRecentSearches]);

  // Perform search
  const search = useCallback(async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    
    if (!trimmedQuery) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);
    setQuery(trimmedQuery);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Filter mock data based on query
      const filtered = mockSearchData.filter(
        item =>
          item.title.toLowerCase().includes(trimmedQuery) ||
          item.description?.toLowerCase().includes(trimmedQuery) ||
          item.category?.toLowerCase().includes(trimmedQuery)
      );

      setSuggestions(filtered);
      
      // Add to recent searches if we have results
      if (filtered.length > 0) {
        addRecentSearch(searchQuery);
      }
    } catch (err) {
      setError('Failed to search. Please try again.');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [addRecentSearch]);

  // Auto-search when query changes
  useEffect(() => {
    if (query) {
      search(query);
    } else {
      setSuggestions([]);
    }
  }, [query, search]);

  return {
    suggestions,
    recentSearches,
    trendingSearches: trendingSearchesData,
    loading,
    error,
    search,
    clearRecentSearches,
    addRecentSearch,
  };
};