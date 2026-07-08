// creates TanStack `Table` instance
import { useMemo } from "react";

import {
  getCoreRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type Table,
  type VisibilityState,
} from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";

import { buildDataGridColumns } from "@/components/table-explorer/data/buildDataGridColumns";
import type {
  TableColumnMeta,
  TableColumnVisibilityState,
  TableRowId,
  TableSortDirection,
} from "@/types/tableExplorer";

interface UseDataGridOptions {
  columnVisibility: TableColumnVisibilityState;
  columns: TableColumnMeta[];
  onColumnVisibilityChange: (next: TableColumnVisibilityState) => void;
  onSelectedRowIdsChange: (rowIds: TableRowId[]) => void;
  onSortChange: (columnId: string, direction: TableSortDirection) => void;
  rows: DynamicTableRow[];
  selectedRowIds: TableRowId[];
  sortColumn: string;
  sortDirection: TableSortDirection;
}

export function useDataGrid({
  columnVisibility,
  columns,
  onColumnVisibilityChange,
  onSelectedRowIdsChange,
  onSortChange,
  rows,
  selectedRowIds,
  sortColumn,
  sortDirection,
}: UseDataGridOptions): Table<DynamicTableRow> {
  const columnDefs = useMemo(
    () => buildDataGridColumns({ columns, sortColumn, sortDirection }),
    [columns, sortColumn, sortDirection],
  );

  const rowSelection = useMemo<RowSelectionState>(() => {
    return Object.fromEntries(selectedRowIds.map((rowId) => [rowId, true]));
  }, [selectedRowIds]);

  const sorting = useMemo<SortingState>(() => [{ id: sortColumn, desc: sortDirection === "desc" }], [sortColumn, sortDirection]);

  return useReactTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    enableRowSelection: true,
    manualSorting: true,
    state: {
      columnVisibility: columnVisibility as VisibilityState,
      rowSelection,
      sorting,
    },
    onRowSelectionChange: (updater) => {
      const nextRowSelection = typeof updater === "function" ? updater(rowSelection) : updater;
      const nextSelectedRowIds = rows
        .filter((row) => nextRowSelection[String(row.id)] === true)
        .map((row) => String(row.id));

      onSelectedRowIdsChange(nextSelectedRowIds);
    },
    onColumnVisibilityChange: (updater) => {
      const nextColumnVisibility = typeof updater === "function" ? updater(columnVisibility as VisibilityState) : updater;
      onColumnVisibilityChange(nextColumnVisibility as TableColumnVisibilityState);
    },
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = nextSorting[0];

      if (nextSort === undefined) {
        onSortChange("id", "asc");
        return;
      }

      onSortChange(nextSort.id, nextSort.desc === true ? "desc" : "asc");
    },
  });
}
