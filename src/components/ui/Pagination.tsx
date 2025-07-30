import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@utils/cn";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPageInfo?: boolean;
  maxVisiblePages?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: {
    button: "h-8 min-w-[32px] px-2 text-xs",
    icon: "h-3 w-3",
    gap: "gap-1",
  },
  md: {
    button: "h-10 min-w-[40px] px-3 text-sm",
    icon: "h-4 w-4",
    gap: "gap-1",
  },
  lg: {
    button: "h-12 min-w-[48px] px-4 text-base",
    icon: "h-5 w-5",
    gap: "gap-2",
  },
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showFirstLast = true,
  showPageInfo = true,
  maxVisiblePages = 5,
  size = "md",
  className,
}) => {
  const styles = sizeStyles[size];

  // Don't render if only one page
  if (totalPages <= 1) return null;

  // Calculate item range for display
  const startItem =
    totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem =
    totalItems && itemsPerPage
      ? Math.min(currentPage * itemsPerPage, totalItems)
      : 0;

  // Generate page numbers to display
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisiblePages) {
      // Show all pages if they fit
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near start
        for (let i = 2; i <= Math.min(4, totalPages - 1); i++) {
          pages.push(i);
        }
        if (totalPages > 4) pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push("...");
        for (let i = Math.max(totalPages - 3, 2); i < totalPages; i++) {
          pages.push(i);
        }
        pages.push(totalPages);
      } else {
        // Middle
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const PaginationButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    children: React.ReactNode;
    ariaLabel?: string;
  }> = ({ onClick, disabled = false, active = false, children, ariaLabel }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={cn(
        styles.button,
        "font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        active
          ? "bg-primary-600 text-white hover:bg-primary-700"
          : disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300",
      )}
    >
      {children}
    </button>
  );

  return (
    <nav
      className={cn("flex items-center justify-between", className)}
      aria-label="Pagination Navigation"
    >
      {/* Mobile view - simplified */}
      <div className="flex sm:hidden items-center gap-2">
        <PaginationButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          ariaLabel="Previous page"
        >
          <ChevronLeft className={styles.icon} />
        </PaginationButton>

        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>

        <PaginationButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          ariaLabel="Next page"
        >
          <ChevronRight className={styles.icon} />
        </PaginationButton>
      </div>

      {/* Desktop view - full pagination */}
      <div className="hidden sm:flex items-center justify-between w-full">
        {/* Page info */}
        {showPageInfo && totalItems && itemsPerPage && (
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{totalItems}</span> results
          </div>
        )}

        {/* Pagination controls */}
        <div className={cn("flex items-center", styles.gap)}>
          {/* First page button */}
          {showFirstLast && (
            <PaginationButton
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              ariaLabel="First page"
            >
              <ChevronsLeft className={styles.icon} />
            </PaginationButton>
          )}

          {/* Previous page button */}
          <PaginationButton
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            ariaLabel="Previous page"
          >
            <ChevronLeft className={styles.icon} />
          </PaginationButton>

          {/* Page numbers */}
          <div className={cn("flex items-center", styles.gap)}>
            {pageNumbers.map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-gray-500"
                  >
                    ...
                  </span>
                );
              }

              return (
                <PaginationButton
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  active={currentPage === page}
                  ariaLabel={`Page ${page}`}
                >
                  {page}
                </PaginationButton>
              );
            })}
          </div>

          {/* Next page button */}
          <PaginationButton
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            ariaLabel="Next page"
          >
            <ChevronRight className={styles.icon} />
          </PaginationButton>

          {/* Last page button */}
          {showFirstLast && (
            <PaginationButton
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              ariaLabel="Last page"
            >
              <ChevronsRight className={styles.icon} />
            </PaginationButton>
          )}
        </div>
      </div>
    </nav>
  );
};

// Simple pagination for basic use cases
export const SimplePagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  size?: "sm" | "md" | "lg";
}> = ({ currentPage, totalPages, onPageChange, size = "md" }) => (
  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={onPageChange}
    showFirstLast={false}
    showPageInfo={false}
    size={size}
  />
);

// Load more button pattern
export const LoadMorePagination: React.FC<{
  hasMore: boolean;
  loading?: boolean;
  onLoadMore: () => void;
  loadingText?: string;
  buttonText?: string;
}> = ({
  hasMore,
  loading = false,
  onLoadMore,
  loadingText = "Loading more...",
  buttonText = "Load More",
}) => {
  if (!hasMore) return null;

  return (
    <div className="flex justify-center mt-8">
      <button
        onClick={onLoadMore}
        disabled={loading}
        className={cn(
          "px-6 py-3 font-medium text-white bg-primary-600 rounded-md",
          "hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors duration-200",
        )}
      >
        {loading ? loadingText : buttonText}
      </button>
    </div>
  );
};
