import type { ColumnDescriptor } from 'jazz-tools'

import type { TableFilterClause } from '@tables/filters/tableFilters'

export interface TableRouteSearch {
  dir?: string
  empty?: 'true'
  filters?: string
  mode?: string | null
  page?: number
  pageSize?: TablePageSize
  rowId?: string | null
  sort?: string
  tab?: string
  view?: string
}

/**
 * Shared state types for the schema-driven table explorer.
 *
 * The Inspector receives Jazz schema metadata at runtime, so route state, row selection,
 * sorting, visibility, and editor state must stay generic. These types define the UI
 * contract around runtime table metadata instead of generated inspected-app types.
 */

/** Content variants available in a selected table tab. */
export type TableExplorerView = 'data' | 'schema'

/** Row detail panel modes that can be encoded in URL search params. */
export type DetailPaneMode = 'edit' | 'insert'

export type TableSortDirection = 'asc' | 'desc'
export type TablePageSize = 100 | 500 | 1000

/** Runtime row IDs are normalized as strings for table state and URLs. */
export type TableRowId = string

/** Sparse valid value overlays keyed by runtime row ID and schema field name. */
export type TableValuesByRowId = Readonly<Record<TableRowId, Readonly<Record<string, unknown>>>>

/** Field-name sets keyed by runtime row ID, such as cells marked after staged updates apply. */
export type TableFieldsByRowId = Readonly<Record<TableRowId, ReadonlySet<string>>>

/** URL-safe table explorer state used to restore navigation and selected rows. */
export interface TableExplorerSearchState {
  editorMode: DetailPaneMode | null
  view: TableExplorerView
  filters: TableFilterClause[]
  page: number
  pageSize: TablePageSize
  rowId: TableRowId | null
  sortColumn: string
  sortDirection: TableSortDirection
}

/** Per-table visibility map keyed by rendered column ID, including synthetic columns. */
export type TableColumnVisibilityState = Record<string, boolean>

/** Column render metadata derived from Jazz schema descriptors plus Inspector columns. */
export interface TableColumnMeta {
  id: string
  label: string
  accessorKey: string
  column: ColumnDescriptor | null
  isSortable: boolean
}
