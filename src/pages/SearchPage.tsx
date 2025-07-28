import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SearchBar } from "@components/ui/SearchBar";
import { SearchResults } from "@components/ui/SearchResults";
import { useSearch } from "@hooks/useSearch";

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const { suggestions, loading, search } = useSearch();

  // Search when query changes
  useEffect(() => {
    if (query) {
      search(query);
      setSearchQuery(query);
    }
  }, [query, search]);

  const handleSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Search
            </h1>
            <div className="max-w-2xl">
              <SearchBar
                size="lg"
                variant="default"
                value={searchQuery}
                onSearch={handleSearch}
                placeholder="Search for products, services, or information..."
              />
            </div>
          </div>

          {/* Search Results */}
          <SearchResults
            results={suggestions}
            query={query}
            loading={loading}
            className="mt-8"
          />

          {/* Search Tips */}
          {!query && (
            <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Search Tips
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 dark:text-primary-400">
                    •
                  </span>
                  <span>Use specific keywords for better results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 dark:text-primary-400">
                    •
                  </span>
                  <span>Try different spellings or synonyms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 dark:text-primary-400">
                    •
                  </span>
                  <span>Use quotes for exact phrases</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 dark:text-primary-400">
                    •
                  </span>
                  <span>
                    Browse categories if you're not sure what to search for
                  </span>
                </li>
              </ul>
            </div>
          )}

          {/* Popular Categories */}
          {!query && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Popular Categories
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Products", href: "/products" },
                  { name: "Services", href: "/services" },
                  { name: "About Us", href: "/about" },
                  { name: "FAQ", href: "/faq" },
                  { name: "Support", href: "/contact" },
                  { name: "Blog", href: "/blog" },
                  { name: "Careers", href: "/careers" },
                  { name: "Partners", href: "/partners" },
                ].map((category) => (
                  <a
                    key={category.name}
                    href={category.href}
                    className="block p-4 text-center bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {category.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SearchPage;
