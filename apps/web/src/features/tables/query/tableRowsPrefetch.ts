import type { WasmSchema } from 'jazz-tools'
import type { JazzClient } from 'jazz-tools/react'

import type { TableFilterClause } from '@tables/filters/tableFilters'
import { buildInitialTableRowsQuery, TABLE_ROWS_QUERY_OPTIONS } from '@tables/query/tableRowsQuery'
import type { TablePageSize, TableSortDirection } from '@tables/tableTypes'

export const TABLE_ROWS_PREFETCH_INTENT_DELAY_MS = 75

interface StartTableRowsPrefetchOptions {
  client: Pick<JazzClient, 'manager'>
  filters?: readonly TableFilterClause[]
  page?: number
  pageSize?: TablePageSize
  schema: WasmSchema
  sortColumn?: string
  sortDirection?: TableSortDirection
  tableName: string
}

/**
 * Starts or joins an initial table-row query through Jazz's orchestrator cache.
 *
 * Subscribing without callbacks is intentional: prefetch only acquires the shared work; the table
 * view becomes the result consumer through `useJazzQueryState`. The returned cleanup releases this
 * speculative reference and must be called when navigation intent ends. Optional search inputs
 * let inactive tabs acquire the exact query represented by their stored route state.
 */
export function startTableRowsPrefetch({
  client,
  filters,
  page,
  pageSize,
  schema,
  sortColumn,
  sortDirection,
  tableName,
}: StartTableRowsPrefetchOptions): () => void {
  const query = buildInitialTableRowsQuery({
    filters,
    page,
    pageSize,
    schema,
    sortColumn,
    sortDirection,
    tableName,
  })
  const key = client.manager.makeQueryKey(query, TABLE_ROWS_QUERY_OPTIONS)
  const entry = client.manager.getCacheEntry(key)

  return entry.subscribe({})
}
