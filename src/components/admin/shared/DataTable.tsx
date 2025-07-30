import React, { useCallback, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  FilterFn,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  Table as TableType,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Filter,
  Download,
  Columns,
  MoreVertical,
  Check,
} from "lucide-react";
import { cn } from "@utils/cn";
import { useAdminStore } from "@store/adminStore";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  showPagination?: boolean;
  showSelection?: boolean;
  showColumnVisibility?: boolean;
  showExport?: boolean;
  onExport?: (data: TData[]) => void;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  emptyMessage?: string;
  stickyHeader?: boolean;
  className?: string;
}

// Global filter function
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

// Fuzzy matching helper
const rankItem = (rowValue: any, searchValue: string) => {
  const options = {
    threshold: 0.3,
  };

  const searchTerms = searchValue.toLowerCase().split(" ");
  const rowValueStr = String(rowValue).toLowerCase();

  const matches = searchTerms.every((term) => rowValueStr.includes(term));

  return {
    passed: matches,
    score: matches ? 1 : 0,
  };
};

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  showPagination = true,
  showSelection = false,
  showColumnVisibility = true,
  showExport = false,
  onExport,
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  stickyHeader = true,
  className,
}: DataTableProps<TData, TValue>) {
  const { viewPreferences } = useAdminStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Enhanced columns with selection
  const enhancedColumns = useMemo(() => {
    if (!showSelection) return columns;

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-600"
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-600"
          aria-label={`Select row ${row.index + 1}`}
        />
      ),
      size: 40,
    };

    return [selectionColumn, ...columns];
  }, [columns, showSelection]);

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: fuzzyFilter,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleExport = useCallback(() => {
    if (onExport) {
      const exportData =
        selectedRows.length > 0
          ? selectedRows.map((row) => row.original)
          : table.getFilteredRowModel().rows.map((row) => row.original);
      onExport(exportData);
    }
  }, [onExport, selectedRows, table]);

  const densityClasses = {
    compact: "px-2 py-1 text-sm",
    normal: "px-4 py-2",
    comfortable: "px-6 py-3 text-lg",
  };

  const cellPadding = densityClasses[viewPreferences.density];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search all columns..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedRows.length} selected
            </span>
          )}

          {showColumnVisibility && <ColumnVisibilityDropdown table={table} />}

          {showExport && onExport && (
            <button
              onClick={handleExport}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead
              className={cn(
                "bg-gray-50 dark:bg-gray-800",
                stickyHeader && "sticky top-0 z-10",
              )}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "text-left font-medium text-gray-700 dark:text-gray-300",
                        cellPadding,
                        header.column.getCanSort() &&
                          "cursor-pointer select-none",
                        viewPreferences.showGridLines &&
                          "border-r border-gray-200 dark:border-gray-700 last:border-r-0",
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ width: header.getSize() }}
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        {header.column.getCanSort() && (
                          <span className="ml-auto">
                            {header.column.getIsSorted() === "desc" ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : header.column.getIsSorted() === "asc" ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronsUpDown className="w-4 h-4 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "border-b border-gray-200 dark:border-gray-700 last:border-b-0",
                      "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                      onRowClick && "cursor-pointer",
                      row.getIsSelected() &&
                        "bg-primary-50 dark:bg-primary-900/20",
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "text-gray-900 dark:text-white",
                          cellPadding,
                          viewPreferences.showGridLines &&
                            "border-r border-gray-200 dark:border-gray-700 last:border-r-0",
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && table.getPageCount() > 1 && (
        <DataTablePagination table={table} />
      )}
    </div>
  );
}

// Column Visibility Dropdown
function ColumnVisibilityDropdown<TData>({
  table,
}: {
  table: TableType<TData>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
      >
        <Columns className="w-4 h-4" />
        Columns
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-2">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={(e) =>
                        column.toggleVisibility(e.target.checked)
                      }
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {column.id}
                    </span>
                  </label>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Pagination Component
function DataTablePagination<TData>({ table }: { table: TableType<TData> }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Showing{" "}
        <span className="font-medium">
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}
        </span>{" "}
        to{" "}
        <span className="font-medium">
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length,
          )}
        </span>{" "}
        of{" "}
        <span className="font-medium">
          {table.getFilteredRowModel().rows.length}
        </span>{" "}
        results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Previous
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
