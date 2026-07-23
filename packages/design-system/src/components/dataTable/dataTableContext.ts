import { createContext, use } from "react";

import type { RowData, Table } from "@tanstack/react-table";

import type {
  DataTableCellTarget,
  DataTableCellSelectionMode,
  DataTableDensity,
  DataTableHeaderContextMenuHandler,
  DataTableRowContextMenuHandler,
  DataTableCellContextMenuHandler,
} from "./dataTable";

export interface DataTableContextValue<TData extends RowData> {
  activeCell: DataTableCellTarget | null;
  activeColumnId: string | null;
  activeRowId: string | null;
  density: DataTableDensity;
  onCellActivate?: (target: DataTableCellTarget, selectionMode: DataTableCellSelectionMode) => void;
  onCellContextMenu?: DataTableCellContextMenuHandler;
  onCellOpen?: (target: DataTableCellTarget) => void;
  onColumnActivate?: (columnId: string | null) => void;
  onHeaderContextMenu?: DataTableHeaderContextMenuHandler;
  onRowActivate?: (rowId: string) => void;
  onRowContextMenu?: DataTableRowContextMenuHandler;
  selectedColumnsByRow: ReadonlyMap<string, ReadonlySet<string>>;
  columnReorderEnabled: boolean;
  getColumnReorderIndex: (columnId: string) => number;
  table: Table<TData>;
}

export const DataTableContext = createContext<DataTableContextValue<RowData> | null>(null);

export function useDataTableContext<TData extends RowData>(): DataTableContextValue<TData> {
  const context = use(DataTableContext);

  if (context === null) {
    throw new Error("DataTable parts must be rendered inside DataTable.Root");
  }

  return context as DataTableContextValue<TData>;
}
