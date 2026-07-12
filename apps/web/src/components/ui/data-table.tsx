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
  /** Column id used for the toolbar text filter. */
  filterColumn?: string;
  filterPlaceholder?: string;
  /** Show the column visibility menu. Defaults to true. */
  showViewOptions?: boolean;
  /** Enable TanStack client-side pagination. Defaults to false. */
  enableClientPagination?: boolean;
  /** Stable row id accessor (recommended when using selection). */
  getRowId?: (originalRow: TData, index: number) => string;
  /** Called when the set of selected original rows changes. */
  onSelectedRowsChange?: (rows: TData[]) => void;
  /** Optional render slot for extra toolbar actions (right side). */
  toolbarActions?: React.ReactNode;
  /** Access the table instance (e.g. for external controls). */
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
  enableClientPagination = false,
  getRowId,
  onSelectedRowsChange,
  toolbarActions,
  tableRef,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
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

  return (
    <div className={cn('w-full', className)}>
      {showToolbar && (
        <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
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
              className="h-8 max-w-sm"
            />
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-2 sm:ml-auto">
            {toolbarActions}
            {showViewOptions && <DataTableViewOptions table={table} />}
          </div>
        </div>
      )}

      <div className={cn('overflow-x-auto rounded-md border', tableClassName)}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedCount > 0 && (
        <p className="px-4 pb-1 text-xs text-muted-foreground">
          {selectedCount} of {filteredCount} row(s) selected.
        </p>
      )}
    </div>
  );
}
