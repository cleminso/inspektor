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

export const DataTableContext = createContext<Stable<DataTableContextValue<RowData>> | null>(null);

/**
 * Preserves the provider's stability contract for compound DataTable parts. Consumers may rely
 * on the complete context reference in memoization and dependency arrays without losing the
 * guarantee established by DataTable.Root.
 */
export function useDataTableContext<TData extends RowData>(): Stable<DataTableContextValue<TData>> {
  const context = use(DataTableContext);

  if (context === null) {
    throw new Error("DataTable parts must be rendered inside DataTable.Root");
  }

  return context as Stable<DataTableContextValue<TData>>;
}
