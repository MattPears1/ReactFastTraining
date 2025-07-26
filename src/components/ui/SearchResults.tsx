import React from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Package, FileText, HelpCircle, File } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchSuggestion } from './SearchInput';

interface SearchResultsProps {
  results: SearchSuggestion[];
  query: string;
  loading?: boolean;
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  product: <Package className="w-5 h-5" />,
  article: <FileText className="w-5 h-5" />,
  faq: <HelpCircle className="w-5 h-5" />,
  page: <File className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  product: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  article: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  faq: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  page: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
};

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  loading,
  className,
}) => {
  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No results found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn't find anything matching "{query}"
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            Try searching with different keywords or check your spelling
          </p>
        </div>
      </div>
    );
  }

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    const category = result.category || 'page';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(result);
    return acc;
  }, {} as Record<string, SearchSuggestion[]>);

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Search Results
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedResults).map(([category, categoryResults]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
              {category}s
            </h3>
            <div className="grid gap-4">
              {categoryResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={result.url || '#'}
                    className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`p-2 rounded-lg flex-shrink-0 ${
                          categoryColors[category] || categoryColors.page
                        }`}
                      >
                        {iconMap[category] || iconMap.page}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {highlightText(result.title, query)}
                        </h4>
                        {result.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {highlightText(result.description, query)}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                            {category}
                          </span>
                          {result.url && (
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {result.url}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Highlight matching text
function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 text-inherit">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}