'use client';

import * as React from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTableViewOptions } from '@/components/ui/data-table-view-options';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  tableClassName?: string;
  emptyMessage?: string;
  filterColumn?: string;
  filterPlaceholder?: string;
  showViewOptions?: boolean;
  enableClientPagination?: boolean;
  pageSize?: number;
  getRowId?: (originalRow: TData, index: number) => string;
  onSelectedRowsChange?: (rows: TData[]) => void;
  toolbarActions?: React.ReactNode;
  tableRef?: React.MutableRefObject<TanstackTable<TData> | null>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  tableClassName,
  emptyMessage = 'No results.',
  filterColumn,
  filterPlaceholder = 'Filter…',
  showViewOptions = true,
  enableClientPagination = true,
  pageSize = 10,
  getRowId,
  onSelectedRowsChange,
  toolbarActions,
  tableRef,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(enableClientPagination
      ? { getPaginationRowModel: getPaginationRowModel() }
      : {}),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    initialState: {
      pagination: { pageSize },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  React.useEffect(() => {
    if (tableRef) {
      tableRef.current = table;
    }
  }, [table, tableRef]);

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);

  React.useEffect(() => {
    onSelectedRowsChange?.(selectedRows);
  }, [rowSelection]);

  const showToolbar = !!filterColumn || showViewOptions || !!toolbarActions;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm',
        className
      )}
    >
      {showToolbar ? (
        <div className="flex flex-col gap-2 border-b border-border/70 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center">
          {filterColumn ? (
            <Input
              placeholder={filterPlaceholder}
              value={
                (table.getColumn(filterColumn)?.getFilterValue() as string) ??
                ''
              }
              onChange={(event) =>
                table
                  .getColumn(filterColumn)
                  ?.setFilterValue(event.target.value)
              }
              className="h-9 max-w-sm bg-background"
            />
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-2 sm:ml-auto">
            {toolbarActions}
            {showViewOptions ? <DataTableViewOptions table={table} /> : null}
          </div>
        </div>
      ) : null}

      <div className={cn('overflow-x-auto', tableClassName)}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-border/70 bg-muted/30 hover:bg-muted/30"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className="h-11 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-border/60"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 border-t border-border/70 bg-muted/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {selectedCount > 0
            ? `${selectedCount} of ${filteredCount} row(s) selected`
            : `${filteredCount} row(s)`}
        </p>
        {enableClientPagination && pageCount > 1 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Page {pageIndex + 1} of {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
