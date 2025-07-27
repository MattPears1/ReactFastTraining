import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions {
  totalItems: number;
  itemsPerPage?: number;
  initialPage?: number;
  siblingCount?: number;
}

interface PaginationRange {
  type: 'page' | 'dots';
  value?: number;
  key: string;
}

export function usePagination({
  totalItems,
  itemsPerPage = 10,
  initialPage = 1,
  siblingCount = 1,
}: UsePaginationOptions) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  const totalPages = Math.ceil(totalItems / pageSize);

  // Ensure current page is within valid range
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const goToPage = useCallback(
    (page: number) => {
      const newPage = Math.min(Math.max(1, page), totalPages);
      setCurrentPage(newPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  const changePageSize = useCallback(
    (newPageSize: number) => {
      const currentStartIndex = (currentPage - 1) * pageSize;
      const newPage = Math.floor(currentStartIndex / newPageSize) + 1;
      setPageSize(newPageSize);
      setCurrentPage(newPage);
    },
    [currentPage, pageSize]
  );

  // Generate pagination range
  const paginationRange = useMemo((): PaginationRange[] => {
    const totalPageNumbers = siblingCount * 2 + 5; // siblings + first + last + current + 2 dots

    // If total pages is less than the page numbers we want to show
    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => ({
        type: 'page' as const,
        value: i + 1,
        key: `page-${i + 1}`,
      }));
    }

    const leftSiblingIndex = Math.max(validCurrentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(
      validCurrentPage + siblingCount,
      totalPages
    );

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    const range: PaginationRange[] = [];

    // Always show first page
    range.push({ type: 'page', value: 1, key: 'page-1' });

    // Show left dots
    if (shouldShowLeftDots) {
      range.push({ type: 'dots', key: 'dots-left' });
    }

    // Show sibling pages
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i === 1 || i === totalPages) continue;
      range.push({ type: 'page', value: i, key: `page-${i}` });
    }

    // Show right dots
    if (shouldShowRightDots) {
      range.push({ type: 'dots', key: 'dots-right' });
    }

    // Always show last page
    if (totalPages > 1) {
      range.push({
        type: 'page',
        value: totalPages,
        key: `page-${totalPages}`,
      });
    }

    return range;
  }, [validCurrentPage, siblingCount, totalPages]);

  return {
    currentPage: validCurrentPage,
    totalPages,
    pageSize,
    startIndex,
    endIndex,
    hasNextPage: validCurrentPage < totalPages,
    hasPreviousPage: validCurrentPage > 1,
    paginationRange,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    changePageSize,
  };
}

// Hook for paginating array data
export function usePaginatedData<T>(
  data: T[],
  options: Omit<UsePaginationOptions, 'totalItems'>
) {
  const pagination = usePagination({
    ...options,
    totalItems: data.length,
  });

  const paginatedData = useMemo(
    () => data.slice(pagination.startIndex, pagination.endIndex),
    [data, pagination.startIndex, pagination.endIndex]
  );

  return {
    ...pagination,
    paginatedData,
    totalItems: data.length,
  };
}