import { createContext, use } from "react";

import type { RowData, Table } from "@tanstack/react-table";

import type {
  DataGridCellTarget,
  DataGridCellSelectionMode,
  DataGridDensity,
  DataGridHeaderContextMenuHandler,
  DataGridRowContextMenuHandler,
  DataGridCellContextMenuHandler,
} from "./dataGrid";

declare const stableBrand: unique symbol;

/**
 * Records that an object preserves its identity until one of its meaningful inputs changes.
 * This is an identity guarantee, not an immutability guarantee.
 *
 * The private unique symbol prevents ordinary structurally compatible objects from satisfying
 * the contract accidentally. It exists only in the type system and is not attached at runtime.
 */
export type Stable<T> = T extends object ? T & { readonly [stableBrand]: true } : T;

/**
 * Marks a value whose referential stability is enforced by the surrounding implementation.
 *
 * TypeScript correctly sees that the runtime value has no phantom brand, so `unknown` forms an
 * explicit trust boundary before applying `Stable<T>`. This function performs no runtime work.
 * Keep calls adjacent to the identity mechanism that proves the contract, such as `useMemo`.
 */
export function asStable<T>(value: T): Stable<T> {
  return value as unknown as Stable<T>;
}

export interface DataGridContextValue<TData extends RowData> {
  activeCell: DataGridCellTarget | null;
  activeColumnId: string | null;
  activeRowId: string | null;
  density: DataGridDensity;
  onCellActivate?: (target: DataGridCellTarget, selectionMode: DataGridCellSelectionMode) => void;
  onCellContextMenu?: DataGridCellContextMenuHandler;
  onColumnActivate?: (columnId: string | null) => void;
  onHeaderContextMenu?: DataGridHeaderContextMenuHandler;
  onRowActivate?: (rowId: string) => void;
  onRowContextMenu?: DataGridRowContextMenuHandler;
  selectedColumnsByRow: ReadonlyMap<string, ReadonlySet<string>>;
  columnReorderEnabled: boolean;
  getColumnReorderIndex: (columnId: string) => number;
  moveColumn: (columnId: string, offset: -1 | 1) => void;
  table: Table<TData>;
}

export const DataGridContext = createContext<Stable<DataGridContextValue<RowData>> | null>(null);

/**
 * Preserves the provider's stability contract for compound DataGrid parts. Consumers may rely
 * on the complete context reference in memoization and dependency arrays without losing the
 * guarantee established by DataGrid.Root.
 */
export function useDataGridContext<TData extends RowData>(): Stable<DataGridContextValue<TData>> {
  const context = use(DataGridContext);

  if (context === null) {
    throw new Error("DataGrid parts must be rendered inside DataGrid.Root");
  }

  return context as Stable<DataGridContextValue<TData>>;
}
