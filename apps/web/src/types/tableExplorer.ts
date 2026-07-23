import type { ColumnDescriptor } from "jazz-tools";

import type { TableFilterClause } from "@/types/tableFilters";

/**
 * Shared state types for the schema-driven table explorer.
 *
 * The Inspector receives Jazz schema metadata at runtime, so route state, row selection,
 * sorting, visibility, and editor state must stay generic. These types define the UI
 * contract around runtime table metadata instead of generated inspected-app types.
 */

/** Top-level panes available for a selected schema table. */
export type TableExplorerView = "data" | "schema";

/** Row detail panel modes that can be encoded in URL search params. */
export type DetailPaneMode = "edit" | "insert";

export type TableSortDirection = "asc" | "desc";

/** Runtime row IDs are normalized as strings for table state and URLs. */
export type TableRowId = string;

/** URL-safe table explorer state used to restore navigation and selected rows. */
export interface TableExplorerSearchState {
  editorMode: DetailPaneMode | null;
  view: TableExplorerView;
  filters: TableFilterClause[];
  rowId: TableRowId | null;
  sortColumn: string;
  sortDirection: TableSortDirection;
}

/** Per-table visibility map keyed by rendered column ID, including synthetic columns. */
export type TableColumnVisibilityState = Record<string, boolean>;

/** Mutually exclusive row editor states for closed, insert, and selected-row edit flows. */
export type InspectorRowEditorState =
  | { kind: "closed" }
  | { kind: "insert" }
  | {
      kind: "edit";
      editedRowIds: TableRowId[];
      activeRowIndex: number;
    };

export type InspectorRowEditorMode = InspectorRowEditorState["kind"];

/** Column render metadata derived from Jazz schema descriptors plus Inspector columns. */
export interface TableColumnMeta {
  id: string;
  label: string;
  accessorKey: string;
  column: ColumnDescriptor | null;
  isSortable: boolean;
}
