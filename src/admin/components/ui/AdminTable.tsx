import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  pagination?: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
}

export function AdminTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  pagination,
  onRowClick,
  rowClassName,
}: AdminTableProps<T>) {
  const getAlignmentClass = (align?: string) => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  if (loading) {
    return (
      <div className="admin-table-container">
        <div className="p-8">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="admin-skeleton h-10 flex-1"></div>
                <div className="admin-skeleton h-10 flex-1"></div>
                <div className="admin-skeleton h-10 flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="admin-table-container">
        <div className="admin-empty-state">
          {emptyIcon && <div className="admin-empty-icon">{emptyIcon}</div>}
          <p className="admin-empty-title">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-table-container">
      <div className="overflow-x-auto admin-scrollbar">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={getAlignmentClass(column.align)}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${rowClassName ? rowClassName(item) : ''}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={getAlignmentClass(column.align)}
                  >
                    {column.render
                      ? column.render(item)
                      : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="admin-card-footer">
          <div className="admin-flex-between">
            <div className="admin-text-small admin-text-muted">
              Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
              {Math.min(
                pagination.currentPage * pagination.itemsPerPage,
                pagination.totalItems
              )}{' '}
              of {pagination.totalItems} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                <ChevronLeft className="admin-icon-sm" />
                Previous
              </button>
              <div className="flex items-center gap-1">
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 ||
                    page === pagination.totalPages ||
                    Math.abs(page - pagination.currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => pagination.onPageChange(page)}
                        className={`
                          px-3 py-1 text-sm rounded-md transition-colors
                          ${
                            page === pagination.currentPage
                              ? 'bg-primary-500 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === pagination.currentPage - 2 ||
                    page === pagination.currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-1 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                Next
                <ChevronRight className="admin-icon-sm" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}