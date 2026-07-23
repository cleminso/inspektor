// creates TanStack `Table` instance
import { useMemo, useRef } from "react";

import {
  getCoreRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type Table,
  type VisibilityState,
} from "@tanstack/react-table";
import type { DynamicTableRow } from "jazz-tools";

import { buildDataTableColumns } from "@/components/table-explorer/data/buildDataTableColumns";
import type { RowSelectionRequest } from "@/components/table-explorer/data/buildDataTableColumns";
import type {
  TableColumnMeta,
  TableColumnVisibilityState,
  TableRowId,
  TableSortDirection,
} from "@/types/tableExplorer";

interface UseDataTableOptions {
  columnOrder: string[];
  columnVisibility: TableColumnVisibilityState;
  columns: TableColumnMeta[];
  onColumnVisibilityChange: (next: TableColumnVisibilityState) => void;
  onSelectedRowIdsChange: (rowIds: TableRowId[]) => void;
  onRowSelectionRequest: (request: RowSelectionRequest) => void;
  onSortChange: (columnId: string, direction: TableSortDirection) => void;
  rows: DynamicTableRow[];
  selectedRowIds: TableRowId[];
  sortColumn: string;
  sortDirection: TableSortDirection;
}

export function useDataTable({
  columnOrder,
  columnVisibility,
  columns,
  onColumnVisibilityChange,
  onSelectedRowIdsChange,
  onRowSelectionRequest,
  onSortChange,
  rows,
  selectedRowIds,
  sortColumn,
  sortDirection,
}: UseDataTableOptions): Table<DynamicTableRow> {
  const onRowSelectionRequestRef = useRef(onRowSelectionRequest);
  onRowSelectionRequestRef.current = onRowSelectionRequest;
  const columnDefs = useMemo(
    () =>
      buildDataTableColumns({
        columns,
        onRowSelectionRequest: (request) => {
          onRowSelectionRequestRef.current(request);
        },
      }),
    [columns],
  );

  const rowSelection = useMemo<RowSelectionState>(() => {
    return Object.fromEntries(selectedRowIds.map((rowId) => [rowId, true]));
  }, [selectedRowIds]);

  const sorting = useMemo<SortingState>(
    () => [{ id: sortColumn, desc: sortDirection === "desc" }],
    [sortColumn, sortDirection],
  );
  const tableColumnOrder = useMemo(() => ["_select", ...columnOrder], [columnOrder]);

  return useReactTable({
    data: rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    columnResizeMode: "onChange",
    enableRowSelection: true,
    manualSorting: true,
    state: {
      columnVisibility: columnVisibility as VisibilityState,
      columnOrder: tableColumnOrder,
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
      const nextColumnVisibility =
        typeof updater === "function" ? updater(columnVisibility as VisibilityState) : updater;
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
