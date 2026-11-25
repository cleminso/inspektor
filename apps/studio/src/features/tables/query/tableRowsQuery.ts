import { Effect } from 'effect'
import type { WasmSchema } from 'jazz-tools'
import {
  buildTableRowsQueryFromSearch,
  tableProvenanceColumnNames,
} from '@inspektor/core/query'
import type { TableFilterClause } from '@tables/filters/tableFilters'
import type { TablePageSize, TableSortDirection } from '@tables/tableTypes'
import type { TableProvenanceColumnName } from '@tables/tableProvenance'

export { isTableColumnSortable, resolveTableSortColumn } from '@inspektor/core/query'
export const TABLE_SORTABLE_PROVENANCE_COLUMN_NAMES = ['$createdAt', '$updatedAt'] as const

export function isTableProvenanceColumnName(
  columnName: string,
): columnName is TableProvenanceColumnName {
  return tableProvenanceColumnNames.some((name) => name === columnName)
}

export function isTableSortableProvenanceColumnName(
  columnName: string,
): columnName is (typeof TABLE_SORTABLE_PROVENANCE_COLUMN_NAMES)[number] {
  return TABLE_SORTABLE_PROVENANCE_COLUMN_NAMES.some((name) => name === columnName)
}

/** The route boundary drops stale URL clauses before constructing validated domain intent. */
export function buildTableRowsQuery({
  schema,
  tableName,
  filters,
  ...search
}: {
  filters: readonly TableFilterClause[]
  page: number
  pageSize: TablePageSize
  schema: WasmSchema
  sortColumn: string
  sortDirection: TableSortDirection
  tableName: string
}) {
  return Effect.runSync(
    buildTableRowsQueryFromSearch({
      schema,
      intent: {
        ...search,
        tableName,
        filters,
      },
    }),
  )
}
