import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@components/ui/Button";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Popular pages that users might be looking for
  const popularPages = [
    {
      name: "Products",
      path: "/products",
      keywords: ["product", "shop", "buy"],
    },
    {
      name: "Services",
      path: "/services",
      keywords: ["service", "solution", "help"],
    },
    {
      name: "About Us",
      path: "/about",
      keywords: ["about", "company", "team"],
    },
    {
      name: "Contact",
      path: "/contact",
      keywords: ["contact", "support", "help"],
    },
    { name: "FAQ", path: "/faq", keywords: ["faq", "question", "help"] },
    { name: "Blog", path: "/blog", keywords: ["blog", "article", "news"] },
    { name: "Pricing", path: "/pricing", keywords: ["price", "cost", "plan"] },
    {
      name: "Documentation",
      path: "/docs",
      keywords: ["docs", "guide", "tutorial"],
    },
  ];

  useEffect(() => {
    // Extract possible search terms from the current URL
    const pathname = window.location.pathname;
    const terms = pathname.split("/").filter((term) => term.length > 2);
    if (terms.length > 0) {
      const searchTerm = terms.join(" ");
      setSearchQuery(searchTerm);
      handleSearch(searchTerm);
    }
  }, []);

  const handleSearch = (query: string) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const matches = popularPages.filter(
      (page) =>
        page.name.toLowerCase().includes(lowercaseQuery) ||
        page.keywords.some((keyword) => keyword.includes(lowercaseQuery)),
    );

    setSuggestions(matches.map((match) => match.path));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      // In a real app, this would navigate to a search results page
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-8xl md:text-9xl font-bold text-primary-600 dark:text-primary-400 mb-4">
              404
            </h1>
            <div className="w-24 h-1 bg-primary-600 dark:bg-primary-400 mx-auto rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Oops! The page you're looking for doesn't exist. It might have
              been moved or deleted.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  placeholder="Search for what you're looking for..."
                  className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Did you mean:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((suggestion) => {
                    const page = popularPages.find(
                      (p) => p.path === suggestion,
                    );
                    return (
                      <Link
                        key={suggestion}
                        to={suggestion}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        {page?.name}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              leftIcon={<ArrowLeft />}
            >
              Go Back
            </Button>
            <Button href="/" leftIcon={<Home />}>
              Go to Homepage
            </Button>
          </motion.div>

          {/* Popular Pages */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Popular pages:
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                to="/products"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Products
              </Link>
              <Link
                to="/services"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Services
              </Link>
              <Link
                to="/about"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Contact
              </Link>
              <Link
                to="/faq"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                FAQ
              </Link>
            </div>
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-20 left-20 w-20 h-20 border-4 border-primary-200 dark:border-primary-800 rounded-full opacity-20"
          />
          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute bottom-20 right-20 w-32 h-32 border-4 border-secondary-200 dark:border-secondary-800 rounded-full opacity-20"
          />
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
