import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
  ArrowUpDown,
  MoreHorizontal 
} from 'lucide-react';
import { cn } from '@utils/cn';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';

// Types
export interface Column<T> {
  key: keyof T | string;
  header: string | React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  mobileLabel?: string; // Label for mobile card view
  hideOnMobile?: boolean;
}

export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  sortState?: SortState;
  onSort?: (column: string) => void;
  selectable?: boolean;
  selectedRows?: T[];
  onRowSelect?: (row: T) => void;
  onSelectAll?: (selected: boolean) => void;
  actions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string | number;
  stickyHeader?: boolean;
  striped?: boolean;
  compact?: boolean;
  responsive?: boolean; // Enable mobile card view
  pagination?: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
};

export function DataTable<T>({
  data,
  columns,
  loading = false,
  error,
  emptyMessage = 'No data available',
  emptyIcon,
  sortState,
  onSort,
  selectable = false,
  selectedRows = [],
  onRowSelect,
  onSelectAll,
  actions,
  onRowClick,
  rowKey,
  stickyHeader = false,
  striped = true,
  compact = false,
  responsive = true,
  pagination,
  className
}: DataTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  // Paginated data
  const paginatedData = useMemo(() => {
    if (!pagination) return data;
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const end = start + pagination.itemsPerPage;
    return data.slice(start, end);
  }, [data, pagination]);

  // Check if all rows are selected
  const allSelected = selectable && selectedRows.length === paginatedData.length && paginatedData.length > 0;
  const someSelected = selectable && selectedRows.length > 0 && selectedRows.length < paginatedData.length;

  // Toggle row expansion (for mobile)
  const toggleRowExpansion = (rowId: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (!sortState || sortState.column !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortState.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  // Mobile card view
  const MobileCard = ({ row }: { row: T }) => {
    const id = rowKey(row);
    const isExpanded = expandedRows.has(id);
    const isSelected = selectedRows.some(r => rowKey(r) === id);

    return (
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-3',
        isSelected && 'ring-2 ring-primary-500',
        onRowClick && 'cursor-pointer hover:shadow-md transition-shadow'
      )}>
        <div 
          className="p-4"
          onClick={() => onRowClick && onRowClick(row)}
        >
          {/* Primary content */}
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              {columns.filter(col => !col.hideOnMobile).map((column, idx) => {
                const value = column.accessor 
                  ? column.accessor(row) 
                  : (row[column.key as keyof T] as React.ReactNode);
                
                if (idx === 0) {
                  // First column as title
                  return (
                    <div key={column.key as string} className="font-semibold text-gray-900 dark:text-white">
                      {value}
                    </div>
                  );
                }
                
                return (
                  <div key={column.key as string} className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {column.mobileLabel || column.header}: 
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">{value}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              {selectable && onRowSelect && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onRowSelect(row);
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              
              {actions && (
                <div onClick={(e) => e.stopPropagation()}>
                  {actions(row)}
                </div>
              )}
              
              {columns.some(col => col.hideOnMobile) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRowExpansion(id);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <ChevronDown className={cn(
                    'h-4 w-4 transition-transform',
                    isExpanded && 'rotate-180'
                  )} />
                </button>
              )}
            </div>
          </div>
          
          {/* Expanded content */}
          {isExpanded && columns.some(col => col.hideOnMobile) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              {columns.filter(col => col.hideOnMobile).map(column => {
                const value = column.accessor 
                  ? column.accessor(row) 
                  : (row[column.key as keyof T] as React.ReactNode);
                
                return (
                  <div key={column.key as string} className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {column.mobileLabel || column.header}: 
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">{value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <LoadingState type="spinner" text="Loading data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <EmptyState
          type="error"
          description={error}
        />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <EmptyState
          type="no-data"
          icon={emptyIcon}
          description={emptyMessage}
        />
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Mobile view */}
      {responsive && (
        <div className="block md:hidden">
          {paginatedData.map(row => (
            <MobileCard key={rowKey(row)} row={row} />
          ))}
          
          {pagination && (
            <div className="mt-4">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={Math.ceil(pagination.totalItems / pagination.itemsPerPage)}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={pagination.onPageChange}
                size="sm"
              />
            </div>
          )}
        </div>
      )}

      {/* Desktop view */}
      <div className={cn(
        'hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden',
        responsive && 'md:block'
      )}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={cn(
              'bg-gray-50 dark:bg-gray-900',
              stickyHeader && 'sticky top-0 z-10'
            )}>
              <tr>
                {selectable && (
                  <th className="px-6 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </th>
                )}
                
                {columns.map(column => (
                  <th
                    key={column.key as string}
                    className={cn(
                      'px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                      alignClasses[column.align || 'left'],
                      column.width,
                      column.headerClassName,
                      column.sortable && onSort && 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200'
                    )}
                    onClick={() => column.sortable && onSort && onSort(column.key as string)}
                  >
                    <div className={cn(
                      'flex items-center gap-1',
                      column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end'
                    )}>
                      {column.header}
                      {column.sortable && onSort && renderSortIcon(column.key as string)}
                    </div>
                  </th>
                ))}
                
                {actions && (
                  <th className="relative px-6 py-3 w-20">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.map((row, rowIndex) => {
                const isSelected = selectedRows.some(r => rowKey(r) === rowKey(row));
                
                return (
                  <tr
                    key={rowKey(row)}
                    className={cn(
                      striped && rowIndex % 2 === 0 && 'bg-gray-50 dark:bg-gray-900/50',
                      isSelected && 'bg-primary-50 dark:bg-primary-900/20',
                      onRowClick && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {selectable && (
                      <td className="px-6 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            onRowSelect && onRowSelect(row);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    
                    {columns.map(column => {
                      const value = column.accessor 
                        ? column.accessor(row) 
                        : (row[column.key as keyof T] as React.ReactNode);
                      
                      return (
                        <td
                          key={column.key as string}
                          className={cn(
                            compact ? 'px-6 py-2' : 'px-6 py-4',
                            'whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
                            alignClasses[column.align || 'left'],
                            column.className
                          )}
                        >
                          {value}
                        </td>
                      );
                    })}
                    
                    {actions && (
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div onClick={(e) => e.stopPropagation()}>
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {pagination && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={Math.ceil(pagination.totalItems / pagination.itemsPerPage)}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.onPageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}