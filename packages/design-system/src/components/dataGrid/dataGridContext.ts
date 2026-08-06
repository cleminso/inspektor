import { createContext, use } from "react";

import type { RowData } from "@tanstack/react-table";

import type {
  DataGridCellTarget,
  DataGridDensity,
  DataGridHeaderContextMenuHandler,
  DataGridRowContextMenuHandler,
  DataGridCellContextMenuHandler,
} from "./dataGrid";
import type { DataGridTable } from "./dataGridFeatures";

export interface DataGridContextValue<TData extends RowData> {
  activeColumnId: string | null;
  activeRowId: string | null;
  density: DataGridDensity;
  onCellActivate?: (target: DataGridCellTarget) => void;
  onCellContextMenu?: DataGridCellContextMenuHandler;
  onColumnActivate?: (columnId: string | null) => void;
  onHeaderContextMenu?: DataGridHeaderContextMenuHandler;
  onRowActivate?: (rowId: string) => void;
  onRowContextMenu?: DataGridRowContextMenuHandler;
  columnReorderEnabled: boolean;
  getColumnReorderIndex: (columnId: string) => number;
  moveColumn: (columnId: string, offset: -1 | 1) => void;
  table: DataGridTable<TData>;
  setViewportElement: (element: HTMLDivElement | null) => void;
  viewportElement: HTMLDivElement | null;
}

export const DataGridContext = createContext<DataGridContextValue<RowData> | null>(null);

export function useDataGridContext<TData extends RowData>(): DataGridContextValue<TData> {
  const context = use(DataGridContext);

  if (context === null) {
    throw new Error("DataGrid parts must be rendered inside DataGrid.Root");
  }

  return context as DataGridContextValue<TData>;
}
