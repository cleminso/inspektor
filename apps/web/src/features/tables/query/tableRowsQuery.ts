import type { QueryOptions, WasmSchema } from 'jazz-tools'

import type { TableFilterClause } from '@tables/filters/tableFilters'
import { GenericQueryBuilder } from '@tables/query/genericQueryBuilder'
import type { TablePageSize, TableSortDirection } from '@tables/tableTypes'

export const TABLE_PAGE_SIZE_OPTIONS = [100, 500, 1000] as const satisfies readonly TablePageSize[]
export const DEFAULT_TABLE_PAGE_SIZE: TablePageSize = 100

/**
 * Query options shared by prefetch and React subscriptions.
 *
 * Keeping this object and its values identical lets Jazz produce one canonical cache key for both
 * callers. The query stays hidden from inspected applications' live-query telemetry.
 */
export const TABLE_ROWS_QUERY_OPTIONS = {
  propagation: 'full',
  visibility: 'hidden_from_live_query_list',
} as const satisfies QueryOptions

interface BuildTableRowsQueryOptions {
  filters: readonly TableFilterClause[]
  page: number
  pageSize: TablePageSize
  schema: WasmSchema
  sortColumn: string
  sortDirection: TableSortDirection
  tableName: string
}

/**
 * Builds a schema-driven Jazz query for an arbitrary inspected table.
 *
 * The extra result is a pagination probe: `useTableRows` renders at most `pageSize` rows
 * and uses the additional row only to derive whether more data can be requested.
 */
export function buildTableRowsQuery({
  filters,
  page,
  pageSize,
  schema,
  sortColumn,
  sortDirection,
  tableName,
}: BuildTableRowsQueryOptions): GenericQueryBuilder {
  let builder = new GenericQueryBuilder(tableName, schema)
  for (const filter of filters) {
    if (filter.operator === 'eq') {
      builder = builder.where({ [filter.column]: filter.value })
    } else {
      builder = builder.where({
        [filter.column]: {
          [filter.operator]: filter.value,
        },
      })
    }
  }

  builder = builder.orderBy(sortColumn, sortDirection)
  if (sortColumn !== 'id') {
    builder = builder.orderBy('id', 'asc')
  }

  return builder.limit(pageSize + 1).offset((page - 1) * pageSize)
}

/**
 * Builds the initial row window started from navigation intent.
 *
 * Omitted search inputs produce the base table query. Table tabs can provide their stored filters
 * and sorting so destination rendering produces the same Jazz cache key.
 */
export function buildInitialTableRowsQuery({
  filters = [],
  page = 1,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
  schema,
  sortColumn = 'id',
  sortDirection = 'asc',
  tableName,
}: {
  filters?: readonly TableFilterClause[]
  page?: number
  pageSize?: TablePageSize
  schema: WasmSchema
  sortColumn?: string
  sortDirection?: TableSortDirection
  tableName: string
}): GenericQueryBuilder {
  return buildTableRowsQuery({
    filters,
    page,
    pageSize,
    schema,
    sortColumn,
    sortDirection,
    tableName,
  })
}
