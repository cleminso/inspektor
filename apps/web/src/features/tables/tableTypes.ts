/**
 * Ownership: declares shared contracts; route, provider, and component boundaries own runtime state.
 * Projections: raw route search is projected into tab, row-query, and resolved explorer state.
 * Persistence: none; URL and workspace storage adapters persist the corresponding projections.
 * Reset boundary: each runtime owner resets against its route, workspace, table, or query identity.
 */
import type { ColumnDescriptor } from 'jazz-tools'

import type { TableFilterClause } from '@tables/filters/tableFilters'

export interface TableRouteSearch {
  dir?: string
  empty?: 'true'
  filters?: string
  page?: number
  pageSize?: TablePageSize
  sort?: string
  view?: string
}

export type TableTabSearch = Pick<
  TableRouteSearch,
  'dir' | 'filters' | 'page' | 'pageSize' | 'sort' | 'view'
>

export type TableTabsRouteSearch = Pick<TableRouteSearch, 'empty'> & TableTabSearch

export type TableRowsSearchInput = Omit<
  Pick<TableRouteSearch, 'dir' | 'filters' | 'page' | 'pageSize' | 'sort'>,
  'pageSize'
> & { pageSize?: number }

/**
 * Shared state types for the schema-driven table explorer.
 *
 * The Inspektor receives Jazz schema metadata at runtime, so route state, row selection,
 * sorting, visibility, and editor state must stay generic. These types define the UI
 * contract around runtime table metadata instead of generated inspected-app types.
 */

/** Content variants available in a selected table tab. */
export type TableExplorerView = 'data' | 'schema'

/** Row form modes used by the local editor surface. */
export type DetailPaneMode = 'edit' | 'insert'

export type TableSortDirection = 'asc' | 'desc'
export type TablePageSize = 100 | 500 | 1000
export const TABLE_PAGE_SIZE_OPTIONS = [100, 500, 1000] as const satisfies readonly TablePageSize[]
export const DEFAULT_TABLE_PAGE_SIZE: TablePageSize = 100

/** Runtime row IDs are normalized as strings for table state. */
export type TableRowId = string

/**
 * Inspektor-local equivalent of Jazz Inspector's private DynamicTableRow.
 * Keep this shape aligned with its generic query row contract when upgrading Jazz.
 */
export interface DynamicTableRow {
  id: string
  [columnName: string]: unknown
}

/** Sparse valid value overlays keyed by runtime row ID and schema field name. */
export type TableValuesByRowId = Readonly<Record<TableRowId, Readonly<Record<string, unknown>>>>

/** Field-name sets keyed by runtime row ID, such as cells marked after staged updates apply. */
export type TableFieldsByRowId = Readonly<Record<TableRowId, ReadonlySet<string>>>

/** URL-safe table explorer state used to restore table query navigation. */
export interface TableRowsSearchState {
  filters: TableFilterClause[]
  page: number
  pageSize: TablePageSize
  sortColumn: string
  sortDirection: TableSortDirection
}

export interface TableExplorerSearchState extends TableRowsSearchState {
  view: TableExplorerView
}

/** Per-table visibility map keyed by rendered column ID, including synthetic columns. */
export type TableColumnVisibilityState = Record<string, boolean>

/** Column render metadata derived from Jazz schema descriptors plus Inspektor columns. */
export interface TableColumnMeta {
  id: string
  label: string
  accessorKey: string
  column: ColumnDescriptor | null
  isHiddenByDefault?: true
  isReadOnly?: true
  isSortable: boolean
}
